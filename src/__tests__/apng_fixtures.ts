import type { IndexedColors } from '../types.ts';

import type { ApngFrameToWrite } from './write_apng.ts';

// Each frame of an APNG is drawn on the output buffer the previous frame left,
// after that frame's dispose_op, and a decoded frame is the whole output buffer
// once it is drawn: https://www.w3.org/TR/png-3/#fcTL-chunk

export const R = [255, 0, 0, 255];
export const G = [0, 255, 0, 255];
export const B = [0, 0, 255, 255];
export const W = [255, 255, 255, 255];
export const K = [0, 0, 0, 255];
export const CLEAR = [0, 0, 0, 0];

export const NONE = 0;
export const BACKGROUND = 1;
export const PREVIOUS = 2;
export const OVER = 1;

/**
 * A one-row RGBA frame, 8 bits a sample.
 * @param colors - Its pixels, left to right, as RGBA.
 * @returns The frame.
 */
export function rgba(...colors: number[][]): ApngFrameToWrite {
  return {
    image: {
      width: colors.length,
      height: 1,
      channels: 4,
      depth: 8,
      data: new Uint8Array(colors.flat()),
    },
  };
}

/**
 * A one-row RGB frame, 8 or 16 bits a sample.
 * @param depth - Bits a sample.
 * @param colors - Its pixels, left to right, as RGB.
 * @returns The frame.
 */
export function rgb(depth: 8 | 16, ...colors: number[][]): ApngFrameToWrite {
  const samples = colors.flat();
  return {
    image: {
      width: colors.length,
      height: 1,
      channels: 3,
      depth,
      data: depth === 8 ? new Uint8Array(samples) : new Uint16Array(samples),
    },
  };
}

/**
 * A one-row indexed frame, its indices packed at the given depth.
 * @param palette - The palette.
 * @param depth - Bits an index.
 * @param indices - Its pixels, left to right.
 * @returns The frame.
 */
export function indexed(
  palette: IndexedColors,
  depth: 2 | 8,
  ...indices: number[]
): ApngFrameToWrite {
  const data = new Uint8Array(Math.ceil((indices.length * depth) / 8));
  for (const [position, index] of indices.entries()) {
    const bit = position * depth;
    data[bit >> 3] |= index << (8 - depth - (bit & 7));
  }
  return {
    image: {
      width: indices.length,
      height: 1,
      channels: 1,
      depth,
      palette,
      data,
    },
  };
}

/**
 * The samples of every decoded frame, as plain arrays.
 * @param decoded - The decoded APNG.
 * @param decoded.frames
 * @returns One array per frame.
 */
export function pixels(decoded: {
  frames: Array<{ data: ArrayLike<number> }>;
}): number[][] {
  return decoded.frames.map((frame) => Array.from(frame.data));
}
