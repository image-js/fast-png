import type { IOBuffer } from 'iobuffer';
import type { DeflateFunctionOptions } from 'pako';

export type { DeflateFunctionOptions } from 'pako';

export type PngDataArray = Uint8Array | Uint8ClampedArray | Uint16Array;

export type DecoderInputType = IOBuffer | ArrayBufferLike | ArrayBufferView;

export type BitDepth = 1 | 2 | 4 | 8 | 16;

export type IndexedColorBitDepth = 1 | 2 | 4 | 8;

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
  text?: Record<string, string>;
  palette?: IndexedColors;
  transparency?: Uint16Array;
}

export interface DecodedPng {
  width: number;
  height: number;
  data: PngDataArray;
  depth: BitDepth;
  channels: number;
  text: Record<string, string>;
  resolution?: PngResolution;
  palette?: IndexedColors;
  transparency?: Uint16Array;
  iccEmbeddedProfile?: IccEmbeddedProfile;
}

export interface DecodedApng {
  width: number;
  height: number;
  depth: BitDepth;
  channels: number;
  numberOfFrames: number;
  numberOfPlays: number;
  text: Record<string, string>;
  resolution?: PngResolution;
  palette?: IndexedColors;
  transparency?: Uint16Array;
  iccEmbeddedProfile?: IccEmbeddedProfile;
  frames: DecodedApngFrame[];
}

export interface ApngFrame {
  sequenceNumber: number;
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  delayNumber: number;
  delayDenominator: number;
  disposeOp: number;
  blendOp: number;
  data: PngDataArray;
}

export interface DecodedApngFrame {
  sequenceNumber: number;
  delayNumber: number;
  delayDenominator: number;
  data: PngDataArray;
}

export interface PngDecoderOptions {
  checkCrc?: boolean;
}

export interface PngEncoderOptions {
  interlace?: 'null' | 'Adam7';
  zlib?: DeflateFunctionOptions;
}

export type IndexedColors = number[][];

export interface IccEmbeddedProfile {
  name: string;
  profile: Uint8Array;
}
