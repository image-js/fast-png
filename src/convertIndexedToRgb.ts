import type { DecodedPng, IndexedColorBitDepth } from './types';

export function convertIndexedToRgb(decodedImage: DecodedPng) {
  const palette = decodedImage.palette;
  const depth = decodedImage.depth as IndexedColorBitDepth;
  if (!palette) {
    throw new Error('Color palette is undefined.');
  }
  isDataValid(decodedImage);
  const indexSize = decodedImage.width * decodedImage.height;
  const resSize = indexSize * palette[0].length;
  const res = new Uint8Array(resSize);
  let indexPos = 0;
  let offset = 0;
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
  const totalPixels = decodedImage.width * decodedImage.height;
  for (let indexByte = 0; indexByte < totalPixels; indexByte++) {
    let bit2 = bit;
    let shift = 8;
    while (bit2 && indexPos < totalPixels) {
      shift -= depth;
      indexes[indexPos++] = (decodedImage.data[indexByte] & bit2) >> shift;
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

function isDataValid(image: DecodedPng): boolean {
  const expectedSize =
    image.depth < 8
      ? Math.ceil((image.width * image.depth) / 8) *
        image.height *
        image.channels
      : image.width * image.height * image.channels;

  if (image.data.length !== expectedSize) {
    throw new RangeError(
      `wrong data size. Found ${image.data.length}, expected ${expectedSize}`,
    );
  }
  return true;
}
