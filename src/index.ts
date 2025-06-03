import PngDecoder from './PngDecoder';
import PngEncoder from './PngEncoder';
import type {
  DecoderInputType,
  PngDecoderOptions,
  DecodedPng,
  DecodedApng,
  ImageData,
  PngEncoderOptions,
} from './types';

export { hasPngSignature } from './helpers/signature';
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

function decodeApng(
  data: DecoderInputType,
  options?: PngDecoderOptions,
): DecodedApng {
  const decoder = new PngDecoder(data, options);
  return decoder.decodeApng();
}

export { decodePng as decode, encodePng as encode, decodeApng };

export { convertIndexedToRgb } from './convertIndexedToRgb';
