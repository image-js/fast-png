import type { DecodedPng, IndexedColors } from './types';

export function convertIndexedToRgb(decodedImage: DecodedPng) {
  const palette = decodedImage.palette as IndexedColors;
  const depth = decodedImage.depth;
  const indexSize = decodedImage.data.length * (8 / depth);
  const resSize = indexSize * palette[0].length;
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
    // Kept for exhaustiveness.
    // eslint-disable-next-line unicorn/no-useless-switch-case
    case 16:
    default:
      throw new Error('Incorrect depth value');
  }

  for (const item of decodedImage.data) {
    let bit2 = bit;
    let shift = 8;
    while (bit2) {
      shift -= depth;
      indexes[indexPos++] = (item & bit2) >> shift;

      bit2 >>= depth;
    }
  }
  if (decodedImage.palette) {
    for (const index of indexes) {
      const color = decodedImage.palette.at(index);
      if (!color) {
        throw new Error('Incorrect index of palette color');
      }
      res.set(color, offset);
      offset += color.length;
    }
  }
  return res;
}
