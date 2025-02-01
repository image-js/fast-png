import { IOBuffer } from 'iobuffer';
import { deflate } from 'pako';

import { writeCrc } from './helpers/crc';
import { writeSignature } from './helpers/signature';
import { encodetEXt } from './helpers/text';
import {
  ColorType,
  CompressionMethod,
  FilterMethod,
  InterlaceMethod,
} from './internalTypes';
import type {
  DeflateFunctionOptions,
  PngEncoderOptions,
  ImageData,
  PngDataArray,
  BitDepth,
} from './types';

const defaultZlibOptions: DeflateFunctionOptions = {
  level: 3,
};

interface PngToEncode {
  width: number;
  height: number;
  data: PngDataArray;
  depth: BitDepth;
  channels: number;
  text?: ImageData['text'];
}

export default class PngEncoder extends IOBuffer {
  private readonly _png: PngToEncode;
  private readonly _zlibOptions: DeflateFunctionOptions;
  private _colorType: ColorType;

  public constructor(data: ImageData, options: PngEncoderOptions = {}) {
    super();
    this._colorType = ColorType.UNKNOWN;
    this._zlibOptions = { ...defaultZlibOptions, ...options.zlib };
    this._png = this._checkData(data);
    this.setBigEndian();
  }

  public encode(): Uint8Array {
    writeSignature(this);
    this.encodeIHDR();
    this.encodeData();
    if (this._png.text) {
      for (const [keyword, text] of Object.entries(this._png.text)) {
        encodetEXt(this, keyword, text);
      }
    }
    this.encodeIEND();
    return this.toArray();
  }

  // https://www.w3.org/TR/PNG/#11IHDR
  private encodeIHDR(): void {
    this.writeUint32(13);

    this.writeChars('IHDR');

    this.writeUint32(this._png.width);
    this.writeUint32(this._png.height);
    this.writeByte(this._png.depth);
    this.writeByte(this._colorType);
    this.writeByte(CompressionMethod.DEFLATE);
    this.writeByte(FilterMethod.ADAPTIVE);
    this.writeByte(InterlaceMethod.NO_INTERLACE);

    writeCrc(this, 17);
  }

  // https://www.w3.org/TR/PNG/#11IEND
  private encodeIEND(): void {
    this.writeUint32(0);

    this.writeChars('IEND');

    writeCrc(this, 4);
  }

  // https://www.w3.org/TR/PNG/#11IDAT
  private encodeIDAT(data: PngDataArray): void {
    this.writeUint32(data.length);

    this.writeChars('IDAT');

    this.writeBytes(data);

    writeCrc(this, data.length + 4);
  }

  private encodeData(): void {
    const { width, height, channels, depth, data } = this._png;
    const slotsPerLine = channels * width;
    const newData = new IOBuffer().setBigEndian();
    let offset = 0;
    for (let i = 0; i < height; i++) {
      newData.writeByte(0); // no filter
      /* istanbul ignore else */
      if (depth === 8) {
        offset = writeDataBytes(data, newData, slotsPerLine, offset);
      } else if (depth === 16) {
        offset = writeDataUint16(data, newData, slotsPerLine, offset);
      } else {
        throw new Error('unreachable');
      }
    }
    const buffer = newData.toArray();
    const compressed = deflate(buffer, this._zlibOptions);
    this.encodeIDAT(compressed);
  }

  private _checkData(data: ImageData): PngToEncode {
    const { colorType, channels, depth } = getColorType(data);
    const png: PngToEncode = {
      width: checkInteger(data.width, 'width'),
      height: checkInteger(data.height, 'height'),
      channels,
      data: data.data,
      depth,
      text: data.text,
    };
    this._colorType = colorType;
    const expectedSize = png.width * png.height * channels;
    if (png.data.length !== expectedSize) {
      throw new RangeError(
        `wrong data size. Found ${png.data.length}, expected ${expectedSize}`,
      );
    }
    return png;
  }
}

function checkInteger(value: number, name: string): number {
  if (Number.isInteger(value) && value > 0) {
    return value;
  }
  throw new TypeError(`${name} must be a positive integer`);
}

interface GetColorTypeReturn {
  channels: number;
  depth: BitDepth;
  colorType: ColorType;
}

function getColorType(data: ImageData): GetColorTypeReturn {
  const { channels = 4, depth = 8 } = data;
  if (channels !== 4 && channels !== 3 && channels !== 2 && channels !== 1) {
    throw new RangeError(`unsupported number of channels: ${channels}`);
  }
  if (depth !== 8 && depth !== 16) {
    throw new RangeError(`unsupported bit depth: ${depth}`);
  }

  const returnValue: GetColorTypeReturn = {
    channels,
    depth,
    colorType: ColorType.UNKNOWN,
  };
  switch (channels) {
    case 4:
      returnValue.colorType = ColorType.TRUECOLOUR_ALPHA;
      break;
    case 3:
      returnValue.colorType = ColorType.TRUECOLOUR;
      break;
    case 1:
      returnValue.colorType = ColorType.GREYSCALE;
      break;
    case 2:
      returnValue.colorType = ColorType.GREYSCALE_ALPHA;
      break;
    default:
      throw new Error('unsupported number of channels');
  }
  return returnValue;
}

function writeDataBytes(
  data: PngDataArray,
  newData: IOBuffer,
  slotsPerLine: number,
  offset: number,
): number {
  for (let j = 0; j < slotsPerLine; j++) {
    newData.writeByte(data[offset++]);
  }
  return offset;
}

function writeDataUint16(
  data: PngDataArray,
  newData: IOBuffer,
  slotsPerLine: number,
  offset: number,
): number {
  for (let j = 0; j < slotsPerLine; j++) {
    newData.writeUint16(data[offset++]);
  }
  return offset;
}
