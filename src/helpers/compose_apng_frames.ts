import { BlendOpType, ColorType, DisposeOpType } from '../internal_types.ts';
import type {
  ApngFrame,
  BitDepth,
  DecodedApngFrame,
  IndexedColors,
  PngDataArray,
} from '../types.ts';

import { decodeInterlaceNull } from './decode_interlace_null.ts';
import { pack, unpack } from './packed_samples.ts';

/** What the frames of an APNG are drawn on. */
export interface ApngCanvas {
  width: number;
  height: number;
  channels: number;
  depth: BitDepth;
  colorType: ColorType;
  /** The palette of an indexed image, with each entry's alpha when tRNS has one. */
  palette?: IndexedColors;
  /** The transparent colour of a greyscale or truecolour image, from tRNS. */
  transparency?: Uint16Array;
}

/**
 * Draw the frames of an APNG one after the other on its output buffer, as a
 * viewer plays them, and give each frame as the whole buffer once it is drawn.
 *
 * Each frame is drawn on what the previous one left after its dispose_op, and
 * blended in by its own blend_op (https://www.w3.org/TR/png-3/#fcTL-chunk).
 * Samples below eight bits are unpacked to be drawn and packed again, so every
 * frame comes back in the layout `decode` gives a whole image.
 * @param frames - The frames, in order, each holding its compressed data.
 * @param canvas - The image the frames are drawn on.
 * @returns The frames as they are displayed.
 */
export function composeApngFrames(
  frames: readonly ApngFrame[],
  canvas: ApngCanvas,
): DecodedApngFrame[] {
  const { width, height, channels, depth } = canvas;
  let output: PngDataArray =
    depth === 16
      ? new Uint16Array(width * height * channels)
      : new Uint8Array(width * height * channels);
  const decoded: DecodedApngFrame[] = [];
  for (const [index, frame] of frames.entries()) {
    const pixels = unpack(
      decodeInterlaceNull({
        data: frame.data as Uint8Array,
        width: frame.width,
        height: frame.height,
        channels,
        depth,
      }),
      frame.width * channels,
      frame.height,
      depth,
    );
    // A first frame has nothing before it to go back to.
    const disposeOp =
      index === 0 && frame.disposeOp === DisposeOpType.PREVIOUS
        ? DisposeOpType.BACKGROUND
        : frame.disposeOp;
    const before: PngDataArray | undefined =
      disposeOp === DisposeOpType.PREVIOUS ? output.slice() : undefined;

    drawFrame(output, pixels, frame, canvas);
    decoded.push({
      sequenceNumber: frame.sequenceNumber,
      delayNumber: frame.delayNumber,
      delayDenominator: frame.delayDenominator,
      data: pack(output, width * channels, height, depth),
    });

    if (disposeOp === DisposeOpType.BACKGROUND) {
      clearRegion(output, frame, canvas);
    } else if (before) {
      output = before;
    }
  }
  return decoded;
}

/**
 * Draw one frame on the output buffer, in its region, by its blend_op.
 * @param output - The output buffer, one sample an element.
 * @param pixels - The frame's samples, one an element.
 * @param frame - Where it goes and how it is blended.
 * @param canvas - The image.
 */
function drawFrame(
  output: PngDataArray,
  pixels: PngDataArray,
  frame: ApngFrame,
  canvas: ApngCanvas,
): void {
  const { width, channels } = canvas;
  const isOpaque = transparencyTest(canvas);
  for (let row = 0; row < frame.height; row++) {
    let target = ((frame.yOffset + row) * width + frame.xOffset) * channels;
    let source = row * frame.width * channels;
    for (let column = 0; column < frame.width; column++) {
      if (frame.blendOp === BlendOpType.SOURCE) {
        copyPixel(output, target, pixels, source, channels);
      } else if (isOpaque) {
        if (isOpaque(pixels, source)) {
          copyPixel(output, target, pixels, source, channels);
        }
      } else {
        blendPixel(output, target, pixels, source, canvas);
      }
      target += channels;
      source += channels;
    }
  }
}

/**
 * How blend_op over treats an image without an alpha channel: a pixel is drawn
 * when it is opaque and left out when it is transparent. A palette entry with
 * an alpha between the two is drawn: indices cannot be mixed.
 * @param canvas - The image.
 * @returns Whether a pixel of the frame is drawn, or `undefined` when the image
 * has an alpha channel and every pixel is blended.
 */
function transparencyTest(
  canvas: ApngCanvas,
): ((pixels: PngDataArray, offset: number) => boolean) | undefined {
  const { colorType, channels, palette, transparency } = canvas;
  if (
    colorType === ColorType.GREYSCALE_ALPHA ||
    colorType === ColorType.TRUECOLOUR_ALPHA
  ) {
    return undefined;
  }
  if (colorType === ColorType.INDEXED_COLOUR) {
    return (pixels, offset) => (palette?.[pixels[offset]]?.[3] ?? 255) !== 0;
  }
  if (!transparency || transparency.length < channels) return () => true;
  return (pixels, offset) => {
    for (let channel = 0; channel < channels; channel++) {
      if (pixels[offset + channel] !== transparency[channel]) return true;
    }
    return false;
  };
}

/**
 * Draw one pixel over another, mixed by their alphas:
 * αo = αs + αd(1 − αs) and Co = (Cs·αs + Cd·αd·(1 − αs)) / αo, rounded.
 * @param output - The output buffer.
 * @param target - The pixel's first sample in it.
 * @param pixels - The frame's samples.
 * @param source - The pixel's first sample in them.
 * @param canvas - The image.
 */
function blendPixel(
  output: PngDataArray,
  target: number,
  pixels: PngDataArray,
  source: number,
  canvas: ApngCanvas,
): void {
  const { channels, depth } = canvas;
  const alpha = channels - 1;
  const maximum = 2 ** depth - 1;
  const sourceAlpha = pixels[source + alpha];
  if (sourceAlpha === 0) return;
  if (sourceAlpha === maximum) {
    copyPixel(output, target, pixels, source, channels);
    return;
  }
  const as = sourceAlpha / maximum;
  const ad = output[target + alpha] / maximum;
  const underneath = ad * (1 - as);
  const ao = as + underneath;
  for (let channel = 0; channel < alpha; channel++) {
    output[target + channel] = Math.round(
      (pixels[source + channel] * as + output[target + channel] * underneath) /
        ao,
    );
  }
  output[target + alpha] = Math.round(ao * maximum);
}

function copyPixel(
  output: PngDataArray,
  target: number,
  pixels: PngDataArray,
  source: number,
  channels: number,
): void {
  for (let channel = 0; channel < channels; channel++) {
    output[target + channel] = pixels[source + channel];
  }
}

/**
 * dispose_op background: the frame's region becomes fully transparent black.
 * @param output - The output buffer.
 * @param frame - The frame whose region it is.
 * @param canvas - The image.
 */
function clearRegion(
  output: PngDataArray,
  frame: ApngFrame,
  canvas: ApngCanvas,
): void {
  const { width, channels } = canvas;
  for (let row = 0; row < frame.height; row++) {
    const start = ((frame.yOffset + row) * width + frame.xOffset) * channels;
    output.fill(0, start, start + frame.width * channels);
  }
}
