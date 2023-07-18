import { IOBuffer } from 'iobuffer';
import { DeflateFunctionOptions } from 'pako';

export { DeflateFunctionOptions };

export type PngDataArray = Uint8Array | Uint8ClampedArray | Uint16Array;

export type DecoderInputType = IOBuffer | ArrayBufferLike | ArrayBufferView;

export type BitDepth = 1 | 2 | 4 | 8 | 16;

export interface PngResolution {
  /**
   * Pixels per unit, X axis
   */
  x: number;
  /**
   * Pixels per unit, Y axis
   */
  y: number;
  /**
   * Unit specifier
   */
  unit: ResolutionUnitSpecifier;
}

export enum ResolutionUnitSpecifier {
  /**
   * Unit is unknown
   */
  UNKNOWN = 0,
  /**
   * Unit is the metre
   */
  METRE = 1,
}

export interface ImageData {
  width: number;
  height: number;
  data: PngDataArray;
  depth?: BitDepth;
  channels?: number;
}

export interface DecodedPng {
  width: number;
  height: number;
  data: PngDataArray;
  depth: BitDepth;
  channels: number;
  text: { [key: string]: string };
  resolution?: PngResolution;
  palette?: IndexedColors;
  transparency?: Uint16Array;
  iccEmbeddedProfile?: IccEmbeddedProfile;
}

export interface PngDecoderOptions {
  checkCrc?: boolean;
}

export interface PngEncoderOptions {
  zlib?: DeflateFunctionOptions;
}

export type IndexedColors = number[][];

export interface IccEmbeddedProfile {
  name: string;
  profile: Uint8Array;
}
