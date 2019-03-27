import { IOBuffer } from 'iobuffer';
import { Inflate as Inflator } from 'pako';

import { pngSignature, crc } from './common';
import { IDecodedPNG, DecoderInputType, IPNGDecoderOptions, PNGDataArray } from './types';

const empty = new Uint8Array(0);
const NULL = '\0';

const uint16 = new Uint16Array([0x00ff]);
const uint8 = new Uint8Array(uint16.buffer);
const osIsLittleEndian = uint8[0] === 0xff;

export default class PNGDecoder extends IOBuffer {
  private _checkCrc: boolean;
  private _inflator: Inflator;
  private _png: IDecodedPNG;
  private _end: boolean;
  private _hasPalette: boolean;
  private _palette?: [number, number, number][];

  public constructor(data: DecoderInputType, options: IPNGDecoderOptions = {}) {
    super(data);
    const { checkCrc = false } = options;
    this._checkCrc = checkCrc;
    this._inflator = new Inflator();
    // @ts-ignore
    this._png = {
      text: {}
    };
    this._end = false;
    this._hasPalette = false;
    // PNG is always big endian
    // https://www.w3.org/TR/PNG/#7Integers-and-byte-order
    this.setBigEndian();
  }

  public decode(): IDecodedPNG {
    this.decodeSignature();
    while (!this._end) {
      this.decodeChunk();
    }
    this.decodeImage();
    return this._png;
  }

  // https://www.w3.org/TR/PNG/#5PNG-file-signature
  private decodeSignature(): void {
    for (let i = 0; i < pngSignature.length; i++) {
      if (this.readUint8() !== pngSignature[i]) {
        throw new Error(
          `wrong PNG signature. Byte at ${i} should be ${pngSignature[i]}.`
        );
      }
    }
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
      case 'tEXt': // 11.3.4.3 tEXt Textual data
        this.decodetEXt(length);
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
      const expectedCrc = this.readUint32();
      const crcLength = length + 4; // includes type
      const actualCrc = crc(
        new Uint8Array(
          this.buffer,
          this.byteOffset + this.offset - crcLength - 4,
          crcLength
        ),
        crcLength
      ); // "- 4" because we already advanced by reading the CRC
      if (actualCrc !== expectedCrc) {
        throw new Error(
          `CRC mismatch for chunk ${type}. Expected ${expectedCrc}, found ${actualCrc}`
        );
      }
    } else {
      this.skip(4);
    }
  }

  // https://www.w3.org/TR/PNG/#11IHDR
  private decodeIHDR(): void {
    const image = this._png;
    image.width = this.readUint32();
    image.height = this.readUint32();
    image.bitDepth = this.readUint8();
    image.colourType = this.readUint8();
    image.compressionMethod = this.readUint8();
    image.filterMethod = this.readUint8();
    image.interlaceMethod = this.readUint8();
    if (this._png.compressionMethod !== 0) {
      throw new Error(
        `Unsupported compression method: ${image.compressionMethod}`
      );
    }
  }

  // https://www.w3.org/TR/PNG/#11PLTE
  private decodePLTE(length: number): void {
    if (length % 3 !== 0) {
      throw new RangeError(
        `PLTE field length must be a multiple of 3. Got ${length}`
      );
    }
    const l = length / 3;
    this._hasPalette = true;
    const palette: [number, number, number][] = [];
    this._palette = palette;
    for (let i = 0; i < l; i++) {
      palette.push([this.readUint8(), this.readUint8(), this.readUint8()]);
    }
  }

  // https://www.w3.org/TR/PNG/#11IDAT
  private decodeIDAT(length: number): void {
    this._inflator.push(
      new Uint8Array(this.buffer, this.offset + this.byteOffset, length),
      false
    );
    this.skip(length);
  }

  // https://www.w3.org/TR/PNG/#11tEXt
  private decodetEXt(length: number): void {
    let keyword = '';
    let char;
    while ((char = this.readChar()) !== NULL) {
      keyword += char;
    }
    this._png.text[keyword] = this.readChars(length - keyword.length - 1);
  }

  // https://www.w3.org/TR/PNG/#11pHYs
  private decodepHYs(): void {
    const ppuX = this.readUint32();
    const ppuY = this.readUint32();
    const unitSpecifier = this.readByte();
    this._png.resolution = [ppuX, ppuY];
    this._png.unitSpecifier = unitSpecifier;
  }

  private decodeImage(): void {
    this._inflator.push(empty, true);
    if (this._inflator.err) {
      throw new Error(
        `Error while decompressing the data: ${this._inflator.err}`
      );
    }
    var data = this._inflator.result;

    if (this._png.filterMethod !== 0) {
      throw new Error(`Filter method ${this._png.filterMethod} not supported`);
    }

    if (this._png.interlaceMethod === 0) {
      this.decodeInterlaceNull(data as Uint8Array);
    } else {
      throw new Error(
        `Interlace method ${this._png.interlaceMethod} not supported`
      );
    }
  }

  private decodeInterlaceNull(data: PNGDataArray): void {
    let channels: number;
    switch (this._png.colourType) {
      case 0:
        channels = 1;
        break;
      case 2:
        channels = 3;
        break;
      case 3:
        if (!this._hasPalette) throw new Error('Missing palette');
        channels = 1;
        break;
      case 4:
        channels = 2;
        break;
      case 6:
        channels = 4;
        break;
      default:
        throw new Error(`Unknown colour type: ${this._png.colourType}`);
    }

    const height = this._png.height;
    const bytesPerPixel = (channels * this._png.bitDepth) / 8;
    const bytesPerLine = this._png.width * bytesPerPixel;
    const newData = new Uint8Array(this._png.height * bytesPerLine);

    let prevLine = empty;
    let offset = 0;
    let currentLine;
    let newLine;

    for (let i = 0; i < height; i++) {
      currentLine = data.subarray(offset + 1, offset + 1 + bytesPerLine);
      newLine = newData.subarray(i * bytesPerLine, (i + 1) * bytesPerLine);
      switch (data[offset]) {
        case 0:
          unfilterNone(currentLine, newLine, bytesPerLine);
          break;
        case 1:
          unfilterSub(currentLine, newLine, bytesPerLine, bytesPerPixel);
          break;
        case 2:
          unfilterUp(currentLine, newLine, prevLine, bytesPerLine);
          break;
        case 3:
          unfilterAverage(
            currentLine,
            newLine,
            prevLine,
            bytesPerLine,
            bytesPerPixel
          );
          break;
        case 4:
          unfilterPaeth(
            currentLine,
            newLine,
            prevLine,
            bytesPerLine,
            bytesPerPixel
          );
          break;
        default:
          throw new Error(`Unsupported filter: ${data[offset]}`);
      }
      prevLine = newLine;
      offset += bytesPerLine + 1;
    }

    if (this._hasPalette) {
      this._png.palette = this._palette;
    }

    if (this._png.bitDepth === 16) {
      const uint16Data = new Uint16Array(newData.buffer);
      if (osIsLittleEndian) {
        for (let k = 0; k < uint16Data.length; k++) {
          // PNG is always big endian. Swap the bytes.
          uint16Data[k] = swap16(uint16Data[k]);
        }
      }
      this._png.data = uint16Data;
    } else {
      this._png.data = newData;
    }
  }
}

function unfilterNone(
  currentLine: PNGDataArray,
  newLine: PNGDataArray,
  bytesPerLine: number
): void {
  for (let i = 0; i < bytesPerLine; i++) {
    newLine[i] = currentLine[i];
  }
}

function unfilterSub(
  currentLine: PNGDataArray,
  newLine: PNGDataArray,
  bytesPerLine: number,
  bytesPerPixel: number
): void {
  let i = 0;
  for (; i < bytesPerPixel; i++) {
    // just copy first bytes
    newLine[i] = currentLine[i];
  }
  for (; i < bytesPerLine; i++) {
    newLine[i] = (currentLine[i] + newLine[i - bytesPerPixel]) & 0xff;
  }
}

function unfilterUp(
  currentLine: PNGDataArray,
  newLine: PNGDataArray,
  prevLine: PNGDataArray,
  bytesPerLine: number
): void {
  let i = 0;
  if (prevLine.length === 0) {
    // just copy bytes for first line
    for (; i < bytesPerLine; i++) {
      newLine[i] = currentLine[i];
    }
  } else {
    for (; i < bytesPerLine; i++) {
      newLine[i] = (currentLine[i] + prevLine[i]) & 0xff;
    }
  }
}

function unfilterAverage(
  currentLine: PNGDataArray,
  newLine: PNGDataArray,
  prevLine: PNGDataArray,
  bytesPerLine: number,
  bytesPerPixel: number
): void {
  let i = 0;
  if (prevLine.length === 0) {
    for (; i < bytesPerPixel; i++) {
      newLine[i] = currentLine[i];
    }
    for (; i < bytesPerLine; i++) {
      newLine[i] = (currentLine[i] + (newLine[i - bytesPerPixel] >> 1)) & 0xff;
    }
  } else {
    for (; i < bytesPerPixel; i++) {
      newLine[i] = (currentLine[i] + (prevLine[i] >> 1)) & 0xff;
    }
    for (; i < bytesPerLine; i++) {
      newLine[i] =
        (currentLine[i] + ((newLine[i - bytesPerPixel] + prevLine[i]) >> 1)) &
        0xff;
    }
  }
}

function unfilterPaeth(
  currentLine: PNGDataArray,
  newLine: PNGDataArray,
  prevLine: PNGDataArray,
  bytesPerLine: number,
  bytesPerPixel: number
): void {
  let i = 0;
  if (prevLine.length === 0) {
    for (; i < bytesPerPixel; i++) {
      newLine[i] = currentLine[i];
    }
    for (; i < bytesPerLine; i++) {
      newLine[i] = (currentLine[i] + newLine[i - bytesPerPixel]) & 0xff;
    }
  } else {
    for (; i < bytesPerPixel; i++) {
      newLine[i] = (currentLine[i] + prevLine[i]) & 0xff;
    }
    for (; i < bytesPerLine; i++) {
      newLine[i] =
        (currentLine[i] +
          paethPredictor(
            newLine[i - bytesPerPixel],
            prevLine[i],
            prevLine[i - bytesPerPixel]
          )) &
        0xff;
    }
  }
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  else if (pb <= pc) return b;
  else return c;
}

function swap16(val: number): number {
  return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
}
