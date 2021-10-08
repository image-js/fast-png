import PngDecoder from './PngDecoder';
import PngEncoder from './PngEncoder';
import {
  DecoderInputType,
  PngDecoderOptions,
  DecodedPng,
  ImageData,
  PngEncoderOptions,
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

export { decodePng as decode, encodePng as encode };
