import { DeflateFunctionOptions } from 'pako';
import { IOBuffer } from 'iobuffer';

export { DeflateFunctionOptions };

export type PNGDataArray = Uint8Array | Uint16Array;

export type DecoderInputType = IOBuffer | ArrayBufferLike | ArrayBufferView;

export interface IDecodedPNG {
  height: number;
  width: number;
  data: PNGDataArray;
  bitDepth: number;
  colourType: number;
  channels: number;
  compressionMethod: number;
  filterMethod: number;
  interlaceMethod: number;
  text: { [key: string]: string };
  resolution?: [number, number];
  unitSpecifier?: number;
  palette?: [number, number, number][];
}

export interface IPNGDecoderOptions {
  checkCrc?: boolean;
}

export interface IImageData {
  width: number;
  height: number;
  data: PNGDataArray;
  components?: number;
  alpha?: boolean | 0 | 1;
  bitDepth?: number;
}

export interface IPNGEncoderOptions {
  zlib?: DeflateFunctionOptions;
}
