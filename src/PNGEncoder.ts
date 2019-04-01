import { IOBuffer } from 'iobuffer';
import { deflate } from 'pako';

import { pngSignature, crc } from './common';
import {
  DeflateFunctionOptions,
  IPNGEncoderOptions,
  IImageData,
  IDecodedPNG,
  PNGDataArray
} from './types';

const defaultZlibOptions: DeflateFunctionOptions = {
  level: 3
};

export default class PNGEncoder extends IOBuffer {
  private _png: IDecodedPNG;
  private _zlibOptions: DeflateFunctionOptions;

  public constructor(data: IImageData, options: IPNGEncoderOptions = {}) {
    super();
    // @ts-ignore
    this._png = {};
    this._checkData(data);
    this._zlibOptions = Object.assign({}, defaultZlibOptions, options.zlib);
    this.setBigEndian();
  }

  public encode(): Uint8Array {
    this.encodeSignature();
    this.encodeIHDR();
    this.encodeData();
    this.encodeIEND();
    return this.toArray();
  }

  // https://www.w3.org/TR/PNG/#5PNG-file-signature
  private encodeSignature(): void {
    this.writeBytes(pngSignature);
  }

  // https://www.w3.org/TR/PNG/#11IHDR
  private encodeIHDR(): void {
    this.writeUint32(13);

    this.writeChars('IHDR');

    this.writeUint32(this._png.width);
    this.writeUint32(this._png.height);
    this.writeByte(this._png.bitDepth);
    this.writeByte(this._png.colourType);
    this.writeByte(0); // Compression method
    this.writeByte(0); // Filter method
    this.writeByte(0); // Interlace method

    this.writeCrc(17);
  }

  // https://www.w3.org/TR/PNG/#11IEND
  private encodeIEND(): void {
    this.writeUint32(0);

    this.writeChars('IEND');

    this.writeCrc(4);
  }

  // https://www.w3.org/TR/PNG/#11IDAT
  private encodeIDAT(data: PNGDataArray): void {
    this.writeUint32(data.length);

    this.writeChars('IDAT');

    this.writeBytes(data);

    this.writeCrc(data.length + 4);
  }

  private encodeData(): void {
    const { width, height, channels, bitDepth, data } = this._png;
    const slotsPerLine = channels * width;
    const newData = new IOBuffer().setBigEndian();
    let offset = 0;
    for (let i = 0; i < height; i++) {
      newData.writeByte(0); // no filter
      /* istanbul ignore else */
      if (bitDepth === 8) {
        offset = writeDataBytes(data, newData, slotsPerLine, offset);
      } else if (bitDepth === 16) {
        offset = writeDataUint16(data, newData, slotsPerLine, offset);
      } else {
        throw new Error('unreachable');
      }
    }
    const buffer = newData.toArray();
    const compressed = deflate(buffer, this._zlibOptions);
    this.encodeIDAT(compressed);
  }

  private _checkData(data: IImageData): void {
    this._png.width = checkInteger(data.width, 'width');
    this._png.height = checkInteger(data.height, 'height');
    this._png.data = data.data;
    const { colourType, channels, bitDepth } = getColourType(data);
    this._png.colourType = colourType;
    this._png.channels = channels;
    this._png.bitDepth = bitDepth;
    const expectedSize = this._png.width * this._png.height * channels;
    if (this._png.data.length !== expectedSize) {
      throw new RangeError(
        `wrong data size. Found ${
          this._png.data.length
        }, expected ${expectedSize}`
      );
    }
  }

  private writeCrc(length: number): void {
    this.writeUint32(
      crc(
        new Uint8Array(
          this.buffer,
          this.byteOffset + this.offset - length,
          length
        ),
        length
      )
    );
  }
}

function checkInteger(value: number, name: string): number {
  if (Number.isInteger(value) && value > 0) {
    return value;
  }
  throw new TypeError(`${name} must be a positive integer`);
}

function getColourType(
  data: IImageData
): { channels: number; bitDepth: number; colourType: number } {
  let { components = 3, bitDepth = 8 } = data;
  if (components !== 3 && components !== 1) {
    throw new RangeError(`unsupported number of components: ${components}`);
  }
  if (bitDepth !== 8 && bitDepth !== 16) {
    throw new RangeError(`unsupported bit depth: ${bitDepth}`);
  }

  let { alpha = true } = data;
  if (alpha === 0 || alpha === 1) {
    alpha = Boolean(alpha);
  }
  if (typeof alpha !== 'boolean') {
    throw new TypeError(`unsupported alpha: ${alpha}`);
  }

  const channels = components + Number(alpha);
  const returnValue = { channels, bitDepth, colourType: -1 };
  switch (channels) {
    case 4:
      returnValue.colourType = 6;
      break;
    case 3:
      returnValue.colourType = 2;
      break;
    case 1:
      returnValue.colourType = 0;
      break;
    case 2:
      returnValue.colourType = 4;
      break;
    default:
      throw new Error(`unsupported number of channels: ${channels}`);
  }
  return returnValue;
}

function writeDataBytes(
  data: PNGDataArray,
  newData: IOBuffer,
  slotsPerLine: number,
  offset: number
): number {
  for (let j = 0; j < slotsPerLine; j++) {
    newData.writeByte(data[offset++]);
  }
  return offset;
}

function writeDataUint16(
  data: PNGDataArray,
  newData: IOBuffer,
  slotsPerLine: number,
  offset: number
): number {
  for (let j = 0; j < slotsPerLine; j++) {
    newData.writeUint16(data[offset++]);
  }
  return offset;
}
