import { IOBuffer } from 'iobuffer';
import { inflate, Inflate as Inflator } from 'pako';

import { checkCrc } from './helpers/crc';
import { decodeInterlaceAdam7 } from './helpers/decodeInterlaceAdam7';
import { decodeInterlaceNull } from './helpers/decodeInterlaceNull';
import { checkSignature } from './helpers/signature';
import { decodetEXt, readKeyword, textChunkName } from './helpers/text';
import {
  ColorType,
  CompressionMethod,
  DisposeOpType,
  FilterMethod,
  InterlaceMethod,
  BlendOpType,
} from './internalTypes';
import type {
  BitDepth,
  DecodedPng,
  DecodedApng,
  DecodedApngFrame,
  ApngFrame,
  DecoderInputType,
  IndexedColors,
  PngDecoderOptions,
} from './types';

export default class PngDecoder extends IOBuffer {
  private readonly _checkCrc: boolean;
  private _inflator: Inflator;
  private readonly _png: DecodedPng;
  private readonly _apng: DecodedApng;
  private _end: boolean;
  private _hasPalette: boolean;
  private _palette: IndexedColors;
  private _hasTransparency: boolean;
  private _transparency: Uint16Array;
  private _compressionMethod: CompressionMethod;
  private _filterMethod: FilterMethod;
  private _interlaceMethod: InterlaceMethod;
  private _colorType: ColorType;
  private _isAnimated: boolean;
  private _numberOfFrames: number;
  private _numberOfPlays: number;
  private _frames: ApngFrame[];
  private _writingDataChunks: boolean;

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
    this._apng = {
      width: -1,
      height: -1,
      channels: -1,
      depth: 1,
      numberOfFrames: 1,
      numberOfPlays: 0,
      text: {},
      frames: [],
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
    this._isAnimated = false;
    this._numberOfFrames = 1;
    this._numberOfPlays = 0;
    this._frames = [];
    this._writingDataChunks = false;
    // PNG is always big endian
    // https://www.w3.org/TR/PNG/#7Integers-and-byte-order
    this.setBigEndian();
  }

  public decode(): DecodedPng {
    checkSignature(this);
    while (!this._end) {
      const length = this.readUint32();
      const type = this.readChars(4);

      this.decodeChunk(length, type);
    }
    this.decodeImage();

    return this._png;
  }

  public decodeApng(): DecodedApng {
    checkSignature(this);
    while (!this._end) {
      const length = this.readUint32();
      const type = this.readChars(4);

      this.decodeApngChunk(length, type);
    }
    this.decodeApngImage();
    return this._apng;
  }

  // https://www.w3.org/TR/PNG/#5Chunk-layout
  private decodeChunk(length: number, type: string): void {
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
  private decodeApngChunk(length: number, type: string): void {
    const offset = this.offset;
    if (type !== 'fdAT' && type !== 'IDAT' && this._writingDataChunks) {
      this.pushDataToFrame();
    }
    switch (type) {
      case 'acTL':
        this.decodeACTL();
        break;
      case 'fcTL':
        this.decodeFCTL();
        break;
      case 'fdAT':
        this.decodeFDAT(length);
        break;
      default:
        this.decodeChunk(length, type);
        this.offset = offset + length;
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

  private decodeACTL(): void {
    this._numberOfFrames = this.readUint32();
    this._numberOfPlays = this.readUint32();
    this._isAnimated = true;
  }

  private decodeFCTL(): void {
    const image: ApngFrame = {
      sequenceNumber: this.readUint32(),
      width: this.readUint32(),
      height: this.readUint32(),
      xOffset: this.readUint32(),
      yOffset: this.readUint32(),
      delayNumber: this.readUint16(),
      delayDenominator: this.readUint16(),
      disposeOp: this.readUint8(),
      blendOp: this.readUint8(),
      data: new Uint8Array(0),
    };
    this._frames.push(image);
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
    this._writingDataChunks = true;
    const dataLength = length;
    const dataOffset = this.offset + this.byteOffset;

    this._inflator.push(new Uint8Array(this.buffer, dataOffset, dataLength));
    if (this._inflator.err) {
      throw new Error(
        `Error while decompressing the data: ${this._inflator.err}`,
      );
    }
    this.skip(length);
  }
  private decodeFDAT(length: number): void {
    this._writingDataChunks = true;
    let dataLength = length;
    let dataOffset = this.offset + this.byteOffset;
    dataOffset += 4;
    dataLength -= 4;
    this._inflator.push(new Uint8Array(this.buffer, dataOffset, dataLength));
    if (this._inflator.err) {
      throw new Error(
        `Error while decompressing the data: ${this._inflator.err}`,
      );
    }
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

  private decodeApngImage() {
    this._apng.width = this._png.width;
    this._apng.height = this._png.height;
    this._apng.channels = this._png.channels;
    this._apng.depth = this._png.depth;
    this._apng.numberOfFrames = this._numberOfFrames;
    this._apng.numberOfPlays = this._numberOfPlays;
    this._apng.text = this._png.text;
    this._apng.resolution = this._png.resolution;
    for (let i = 0; i < this._numberOfFrames; i++) {
      const newFrame: DecodedApngFrame = {
        sequenceNumber: this._frames[i].sequenceNumber,
        delayNumber: this._frames[i].delayNumber,
        delayDenominator: this._frames[i].delayDenominator,
        data:
          this._apng.depth === 8
            ? new Uint8Array(
                this._apng.width * this._apng.height * this._apng.channels,
              )
            : new Uint16Array(
                this._apng.width * this._apng.height * this._apng.channels,
              ),
      };

      const frame = this._frames.at(i);

      if (frame) {
        frame.data = decodeInterlaceNull({
          data: frame.data as Uint8Array,
          width: frame.width,
          height: frame.height,
          channels: this._apng.channels,
          depth: this._apng.depth,
        });

        if (this._hasPalette) {
          this._apng.palette = this._palette;
        }
        if (this._hasTransparency) {
          this._apng.transparency = this._transparency;
        }
        if (
          i === 0 ||
          (frame.xOffset === 0 &&
            frame.yOffset === 0 &&
            frame.width === this._png.width &&
            frame.height === this._png.height)
        ) {
          newFrame.data = frame.data;
        } else {
          const prevFrame = this._apng.frames.at(i - 1);
          this.disposeFrame(frame, prevFrame as DecodedApngFrame, newFrame);
          this.addFrameDataToCanvas(newFrame, frame);
        }
        this._apng.frames.push(newFrame);
      }
    }
    return this._apng;
  }
  private disposeFrame(
    frame: ApngFrame,
    prevFrame: DecodedApngFrame,
    imageFrame: DecodedApngFrame,
  ): void {
    switch (frame.disposeOp) {
      case DisposeOpType.NONE:
        break;
      case DisposeOpType.BACKGROUND:
        for (let row = 0; row < this._png.height; row++) {
          for (let col = 0; col < this._png.width; col++) {
            const index = (row * frame.width + col) * this._png.channels;
            for (let channel = 0; channel < this._png.channels; channel++) {
              imageFrame.data[index + channel] = 0;
            }
          }
        }
        break;
      case DisposeOpType.PREVIOUS:
        imageFrame.data.set(prevFrame.data);
        break;
      default:
        throw new Error('Unknown disposeOp');
    }
  }
  private addFrameDataToCanvas(
    imageFrame: DecodedApngFrame,
    frame: ApngFrame,
  ): void {
    const maxValue = 1 << this._png.depth;
    const calculatePixelIndices = (row: number, col: number) => {
      const index =
        ((row + frame.yOffset) * this._png.width + frame.xOffset + col) *
        this._png.channels;
      const frameIndex = (row * frame.width + col) * this._png.channels;
      return { index, frameIndex };
    };
    switch (frame.blendOp) {
      case BlendOpType.SOURCE:
        for (let row = 0; row < frame.height; row++) {
          for (let col = 0; col < frame.width; col++) {
            const { index, frameIndex } = calculatePixelIndices(row, col);
            for (let channel = 0; channel < this._png.channels; channel++) {
              imageFrame.data[index + channel] =
                frame.data[frameIndex + channel];
            }
          }
        }
        break;
      // https://www.w3.org/TR/png-3/#13Alpha-channel-processing
      case BlendOpType.OVER:
        for (let row = 0; row < frame.height; row++) {
          for (let col = 0; col < frame.width; col++) {
            const { index, frameIndex } = calculatePixelIndices(row, col);
            for (let channel = 0; channel < this._png.channels; channel++) {
              const sourceAlpha =
                frame.data[frameIndex + this._png.channels - 1] / maxValue;
              const foregroundValue =
                channel % (this._png.channels - 1) === 0
                  ? 1
                  : frame.data[frameIndex + channel];
              const value = Math.floor(
                sourceAlpha * foregroundValue +
                  (1 - sourceAlpha) * imageFrame.data[index + channel],
              );
              imageFrame.data[index + channel] += value;
            }
          }
        }
        break;
      default:
        throw new Error('Unknown blendOp');
    }
  }
  private decodeImage(): void {
    if (this._inflator.err) {
      throw new Error(
        `Error while decompressing the data: ${this._inflator.err}`,
      );
    }

    const data = this._isAnimated
      ? (this._frames?.at(0) as ApngFrame).data
      : this._inflator.result;

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
    } else if (this._interlaceMethod === InterlaceMethod.ADAM7) {
      this._png.data = decodeInterlaceAdam7({
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

  private pushDataToFrame() {
    const result = this._inflator.result;
    const lastFrame = this._frames.at(-1);
    if (lastFrame) {
      lastFrame.data = result as Uint8Array;
    } else {
      this._frames.push({
        sequenceNumber: 0,
        width: this._png.width,
        height: this._png.height,
        xOffset: 0,
        yOffset: 0,
        delayNumber: 0,
        delayDenominator: 0,
        disposeOp: DisposeOpType.NONE,
        blendOp: BlendOpType.SOURCE,
        data: result as Uint8Array,
      });
    }
    this._inflator = new Inflator();
    this._writingDataChunks = false;
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
