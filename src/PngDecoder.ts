import { IOBuffer } from 'iobuffer';
import { inflate, Inflate as Inflator } from 'pako';

import { checkCrc } from './helpers/crc';
import { decodeInterlaceNull } from './helpers/decodeInterlaceNull';
import { checkSignature } from './helpers/signature';
import { decodetEXt, readKeyword, textChunkName } from './helpers/text';
import {
  ColorType,
  CompressionMethod,
  FilterMethod,
  InterlaceMethod,
} from './internalTypes';
import type {
  BitDepth,
  DecodedPng,
  DecoderInputType,
  IndexedColors,
  PngDecoderOptions,
} from './types';

export default class PngDecoder extends IOBuffer {
  private readonly _checkCrc: boolean;
  private readonly _inflator: Inflator;
  private readonly _png: DecodedPng;
  private _end: boolean;
  private _hasPalette: boolean;
  private _palette: IndexedColors;
  private _hasTransparency: boolean;
  private _transparency: Uint16Array;
  private _compressionMethod: CompressionMethod;
  private _filterMethod: FilterMethod;
  private _interlaceMethod: InterlaceMethod;
  private _colorType: ColorType;

  public constructor(data: DecoderInputType, options: PngDecoderOptions = {}) {
    super(data);
    const { checkCrc = false } = options;
    this._checkCrc = checkCrc;
    this._inflator = new Inflator();
    this._png = {
      width: -1,
      height: -1,
      channels: -1,
      data: new Uint8Array(0),
      depth: 1,
      text: {},
    };
    this._end = false;
    this._hasPalette = false;
    this._palette = [];
    this._hasTransparency = false;
    this._transparency = new Uint16Array(0);
    this._compressionMethod = CompressionMethod.UNKNOWN;
    this._filterMethod = FilterMethod.UNKNOWN;
    this._interlaceMethod = InterlaceMethod.UNKNOWN;
    this._colorType = ColorType.UNKNOWN;
    // PNG is always big endian
    // https://www.w3.org/TR/PNG/#7Integers-and-byte-order
    this.setBigEndian();
  }

  public decode(): DecodedPng {
    checkSignature(this);
    while (!this._end) {
      this.decodeChunk();
    }
    this.decodeImage();
    return this._png;
  }

  // https://www.w3.org/TR/PNG/#5Chunk-layout
  private decodeChunk(): void {
    const length = this.readUint32();
    const type = this.readChars(4);
    const offset = this.offset;
    switch (type) {
      // 11.2 Critical chunks
      case 'IHDR': // 11.2.2 IHDR Image header
        this.decodeIHDR();
        break;
      case 'PLTE': // 11.2.3 PLTE Palette
        this.decodePLTE(length);
        break;
      case 'IDAT': // 11.2.4 IDAT Image data
        this.decodeIDAT(length);
        break;
      case 'IEND': // 11.2.5 IEND Image trailer
        this._end = true;
        break;
      // 11.3 Ancillary chunks
      case 'tRNS': // 11.3.2.1 tRNS Transparency
        this.decodetRNS(length);
        break;
      case 'iCCP': // 11.3.3.3 iCCP Embedded ICC profile
        this.decodeiCCP(length);
        break;
      case textChunkName: // 11.3.4.3 tEXt Textual data
        decodetEXt(this._png.text, this, length);
        break;
      case 'pHYs': // 11.3.5.3 pHYs Physical pixel dimensions
        this.decodepHYs();
        break;
      default:
        this.skip(length);
        break;
    }
    if (this.offset - offset !== length) {
      throw new Error(`Length mismatch while decoding chunk ${type}`);
    }
    if (this._checkCrc) {
      checkCrc(this, length + 4, type);
    } else {
      this.skip(4);
    }
  }

  // https://www.w3.org/TR/PNG/#11IHDR
  private decodeIHDR(): void {
    const image = this._png;
    image.width = this.readUint32();
    image.height = this.readUint32();
    image.depth = checkBitDepth(this.readUint8());

    const colorType = this.readUint8() as ColorType;
    this._colorType = colorType;
    let channels: number;
    switch (colorType) {
      case ColorType.GREYSCALE:
        channels = 1;
        break;
      case ColorType.TRUECOLOUR:
        channels = 3;
        break;
      case ColorType.INDEXED_COLOUR:
        channels = 1;
        break;
      case ColorType.GREYSCALE_ALPHA:
        channels = 2;
        break;
      case ColorType.TRUECOLOUR_ALPHA:
        channels = 4;
        break;
      // Kept for exhaustiveness.
      // eslint-disable-next-line unicorn/no-useless-switch-case
      case ColorType.UNKNOWN:
      default:
        throw new Error(`Unknown color type: ${colorType}`);
    }
    this._png.channels = channels;

    this._compressionMethod = this.readUint8() as CompressionMethod;
    if (this._compressionMethod !== CompressionMethod.DEFLATE) {
      throw new Error(
        `Unsupported compression method: ${this._compressionMethod}`,
      );
    }

    this._filterMethod = this.readUint8() as FilterMethod;
    this._interlaceMethod = this.readUint8() as InterlaceMethod;
  }

  // https://www.w3.org/TR/PNG/#11PLTE
  private decodePLTE(length: number): void {
    if (length % 3 !== 0) {
      throw new RangeError(
        `PLTE field length must be a multiple of 3. Got ${length}`,
      );
    }
    const l = length / 3;
    this._hasPalette = true;
    const palette: IndexedColors = [];
    this._palette = palette;
    for (let i = 0; i < l; i++) {
      palette.push([this.readUint8(), this.readUint8(), this.readUint8()]);
    }
  }

  // https://www.w3.org/TR/PNG/#11IDAT
  private decodeIDAT(length: number): void {
    this._inflator.push(
      new Uint8Array(this.buffer, this.offset + this.byteOffset, length),
    );
    this.skip(length);
  }

  // https://www.w3.org/TR/PNG/#11tRNS
  private decodetRNS(length: number): void {
    switch (this._colorType) {
      case ColorType.GREYSCALE:
      case ColorType.TRUECOLOUR: {
        if (length % 2 !== 0) {
          throw new RangeError(
            `tRNS chunk length must be a multiple of 2. Got ${length}`,
          );
        }
        if (length / 2 > this._png.width * this._png.height) {
          throw new Error(
            `tRNS chunk contains more alpha values than there are pixels (${
              length / 2
            } vs ${this._png.width * this._png.height})`,
          );
        }
        this._hasTransparency = true;
        this._transparency = new Uint16Array(length / 2);
        for (let i = 0; i < length / 2; i++) {
          this._transparency[i] = this.readUint16();
        }
        break;
      }
      case ColorType.INDEXED_COLOUR: {
        if (length > this._palette.length) {
          throw new Error(
            `tRNS chunk contains more alpha values than there are palette colors (${length} vs ${this._palette.length})`,
          );
        }
        let i = 0;
        for (; i < length; i++) {
          const alpha = this.readByte();
          this._palette[i].push(alpha);
        }
        for (; i < this._palette.length; i++) {
          this._palette[i].push(255);
        }
        break;
      }
      // Kept for exhaustiveness.
      /* eslint-disable unicorn/no-useless-switch-case */
      case ColorType.UNKNOWN:
      case ColorType.GREYSCALE_ALPHA:
      case ColorType.TRUECOLOUR_ALPHA:
      default: {
        throw new Error(
          `tRNS chunk is not supported for color type ${this._colorType}`,
        );
      }
      /* eslint-enable unicorn/no-useless-switch-case */
    }
  }

  // https://www.w3.org/TR/PNG/#11iCCP
  private decodeiCCP(length: number): void {
    const name = readKeyword(this);
    const compressionMethod = this.readUint8();
    if (compressionMethod !== CompressionMethod.DEFLATE) {
      throw new Error(
        `Unsupported iCCP compression method: ${compressionMethod}`,
      );
    }
    const compressedProfile = this.readBytes(length - name.length - 2);
    this._png.iccEmbeddedProfile = {
      name,
      profile: inflate(compressedProfile),
    };
  }

  // https://www.w3.org/TR/PNG/#11pHYs
  private decodepHYs(): void {
    const ppuX = this.readUint32();
    const ppuY = this.readUint32();
    const unitSpecifier = this.readByte();
    this._png.resolution = { x: ppuX, y: ppuY, unit: unitSpecifier };
  }

  private decodeImage(): void {
    if (this._inflator.err) {
      throw new Error(
        `Error while decompressing the data: ${this._inflator.err}`,
      );
    }
    const data = this._inflator.result;

    if (this._filterMethod !== FilterMethod.ADAPTIVE) {
      throw new Error(`Filter method ${this._filterMethod} not supported`);
    }

    if (this._interlaceMethod === InterlaceMethod.NO_INTERLACE) {
      this._png.data = decodeInterlaceNull({
        data: data as Uint8Array,
        width: this._png.width,
        height: this._png.height,
        channels: this._png.channels,
        depth: this._png.depth,
      });
    } else {
      throw new Error(
        `Interlace method ${this._interlaceMethod} not supported`,
      );
    }

    if (this._hasPalette) {
      this._png.palette = this._palette;
    }
    if (this._hasTransparency) {
      this._png.transparency = this._transparency;
    }
  }
}

function checkBitDepth(value: number): BitDepth {
  if (
    value !== 1 &&
    value !== 2 &&
    value !== 4 &&
    value !== 8 &&
    value !== 16
  ) {
    throw new Error(`invalid bit depth: ${value}`);
  }
  return value;
}
