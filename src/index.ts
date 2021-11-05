import PngDecoder from './PngDecoder';
import PngEncoder from './PngEncoder';
import {
  DecoderInputType,
  PngDecoderOptions,
  DecodedPng,
  ImageData,
  PngEncoderOptions,
  IndexedColorBitDepth,
  IndexedColors,
} from './types';

export * from './types';

function decodePng(
  data: DecoderInputType,
  options?: PngDecoderOptions,
): DecodedPng {
  const decoder = new PngDecoder(data, options);
  return decoder.decode();
}

function encodePng(png: ImageData, options?: PngEncoderOptions): Uint8Array {
  const encoder = new PngEncoder(png, options);
  return encoder.encode();
}

function rgb(
  data: Uint8Array,
  depth: IndexedColorBitDepth,
  palette: IndexedColors,
) {
  const indexSize = data.length * (8 / depth);
  const resSize = indexSize * 3;
  const res = new Uint8Array(resSize);

  let offset = 0;
  let indexPos = 0;
  const indexes = new Uint8Array(indexSize);
  let bit = 0xff;
  switch (depth) {
    case 1:
      bit = 0x80;
      break;
    case 2:
      bit = 0xc0;
      break;
    case 4:
      bit = 0xf0;
      break;
    case 8:
      bit = 0xff;
      break;
    default:
      throw new Error('Incorrect depth value');
  }

  for (const item of data) {
    let bit2 = bit;
    let shift = 8;
    while (bit2) {
      shift -= depth;
      indexes[indexPos++] = (item & bit2) >> shift;

      bit2 >>= depth;
    }
  }

  for (const index of indexes) {
    const color = palette[index];
    if (!color) {
      throw new Error('Incorrect index of palette color');
    }
    res.set(color, offset);
    offset += 3;
  }

  return res;
}

export { decodePng as decode, encodePng as encode, rgb };
