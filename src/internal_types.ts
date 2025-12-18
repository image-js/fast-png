export const ColorType = {
  UNKNOWN: -1,
  GREYSCALE: 0,
  TRUECOLOUR: 2,
  INDEXED_COLOUR: 3,
  GREYSCALE_ALPHA: 4,
  TRUECOLOUR_ALPHA: 6,
} as const;
export type ColorType = (typeof ColorType)[keyof typeof ColorType];

export const CompressionMethod = {
  UNKNOWN: -1,
  DEFLATE: 0,
} as const;
export type CompressionMethod =
  (typeof CompressionMethod)[keyof typeof CompressionMethod];

export const FilterMethod = {
  UNKNOWN: -1,
  ADAPTIVE: 0,
} as const;
export type FilterMethod = (typeof FilterMethod)[keyof typeof FilterMethod];

export const InterlaceMethod = {
  UNKNOWN: -1,
  NO_INTERLACE: 0,
  ADAM7: 1,
} as const;
export type InterlaceMethod =
  (typeof InterlaceMethod)[keyof typeof InterlaceMethod];

export const DisposeOpType = {
  NONE: 0,
  BACKGROUND: 1,
  PREVIOUS: 2,
} as const;
export type DisposeOpType = (typeof DisposeOpType)[keyof typeof DisposeOpType];

export const BlendOpType = {
  SOURCE: 0,
  OVER: 1,
} as const;
export type BlendOpType = (typeof BlendOpType)[keyof typeof BlendOpType];
