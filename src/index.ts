import PngDecoder from './png_decoder.ts';
import PngEncoder from './png_encoder.ts';
import type {
  DecodedApng,
  DecodedPng,
  DecoderInputType,
  ImageData,
  PngDecoderOptions,
  PngEncoderOptions,
} from './types.ts';

export { hasPngSignature } from './helpers/signature.ts';
export * from './types.ts';

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

function decodeApng(
  data: DecoderInputType,
  options?: PngDecoderOptions,
): DecodedApng {
  const decoder = new PngDecoder(data, options);
  return decoder.decodeApng();
}

export { decodeApng, decodePng as decode, encodePng as encode };

export { convertIndexedToRgb } from './convert_indexed_to_rgb.ts';
