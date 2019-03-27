import PNGDecoder from './PNGDecoder';
import PNGEncoder from './PNGEncoder';
import {
  DecoderInputType,
  IPNGDecoderOptions,
  IDecodedPNG,
  IImageData,
  IPNGEncoderOptions
} from './types';

// eslint-disable-next-line no-duplicate-imports
export * from './types';

function decodePNG(
  data: DecoderInputType,
  options?: IPNGDecoderOptions
): IDecodedPNG {
  const decoder = new PNGDecoder(data, options);
  return decoder.decode();
}

function encodePNG(png: IImageData, options?: IPNGEncoderOptions): Uint8Array {
  const encoder = new PNGEncoder(png, options);
  return encoder.encode();
}

export { decodePNG as decode, encodePNG as encode };
