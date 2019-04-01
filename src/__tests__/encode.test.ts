// @ts-ignore
import { PNG } from 'pngjs';

import { encode, decode } from '../index';

describe('encode', () => {
  it('simple RGBA', () => {
    const dataArray = new Uint8Array([
      255,
      255,
      255,
      255,
      0,
      0,
      0,
      255,
      0,
      0,
      0,
      255,
      255,
      255,
      255,
      255
    ]);
    const data = encode({
      width: 2,
      height: 2,
      data: dataArray
    });
    expect(data).toBeInstanceOf(Uint8Array);
    const decoded = decode(data);
    const expected = {
      width: 2,
      height: 2,
      bitDepth: 8,
      colourType: 6
    };
    check(decoded, expected);
    checkPngJs(data, expected);
    expect(decoded.data).toBeInstanceOf(Uint8Array);
    expect(decoded.data).toStrictEqual(dataArray);
  });

  it('simple GREY', () => {
    const dataArray = new Uint8Array([0, 32, 64, 96, 127, 255]);
    const data = encode({
      width: 2,
      height: 3,
      data: dataArray,
      components: 1,
      alpha: false
    });
    expect(data).toBeInstanceOf(Uint8Array);
    const decoded = decode(data);
    const expected = {
      width: 2,
      height: 3,
      bitDepth: 8,
      colourType: 0
    };
    check(decoded, expected);
    checkPngJs(data, expected);
    expect(decoded.data).toBeInstanceOf(Uint8Array);
    expect(decoded.data).toStrictEqual(dataArray);
  });

  it('RGB 16-bit', () => {
    const dataArray = new Uint16Array([
      65535,
      65535,
      65535,
      0,
      0,
      0,
      32768,
      32768,
      32768,
      500,
      500,
      500
    ]);
    const data = encode({
      width: 2,
      height: 2,
      bitDepth: 16,
      data: dataArray,
      components: 3,
      alpha: false
    });
    expect(data).toBeInstanceOf(Uint8Array);
    const decoded = decode(data);
    const expected = {
      width: 2,
      height: 2,
      bitDepth: 16,
      colourType: 2
    };
    check(decoded, expected);
    checkPngJs(data, expected);
    expect(decoded.data).toBeInstanceOf(Uint16Array);
    expect(decoded.data).toStrictEqual(dataArray);
  });

  it('GREYA 16-bit', () => {
    const dataArray = new Uint8Array([
      0,
      0,
      32,
      127,
      64,
      255,
      96,
      0,
      127,
      127,
      255,
      255
    ]);
    const data = encode({
      width: 2,
      height: 3,
      data: dataArray,
      components: 1,
      alpha: true
    });
    expect(data).toBeInstanceOf(Uint8Array);
    const decoded = decode(data);
    const expected = {
      width: 2,
      height: 3,
      bitDepth: 8,
      colourType: 4
    };
    check(decoded, expected);
    checkPngJs(data, expected);
    expect(decoded.data).toBeInstanceOf(Uint8Array);
    expect(decoded.data).toStrictEqual(dataArray);
  });

  it('errors', () => {
    expect(() =>
      encode({
        width: 1,
        height: 1,
        bitDepth: 8,
        data: new Uint8Array(),
        components: 5,
        alpha: true
      })
    ).toThrow('unsupported number of components: 5');
    expect(() =>
      encode({
        width: 1,
        height: 1,
        bitDepth: 8,
        data: new Uint8Array(),
        components: 3,
        // @ts-ignore
        alpha: 2
      })
    ).toThrow('unsupported alpha: 2');
    expect(() =>
      encode({
        width: 1.1,
        height: 1,
        bitDepth: 8,
        data: new Uint8Array(),
        components: 3,
        alpha: false
      })
    ).toThrow('width must be a positive integer');
    expect(() =>
      encode({
        width: 1,
        // @ts-ignore
        height: undefined,
        bitDepth: 8,
        data: new Uint8Array(),
        components: 3,
        alpha: false
      })
    ).toThrow('height must be a positive integer');
    expect(() =>
      encode({
        width: 1,
        height: 1,
        bitDepth: 8,
        data: new Uint8Array(10),
        components: 3,
        alpha: false
      })
    ).toThrow('wrong data size. Found 10, expected 3');
    expect(() =>
      encode({
        width: 1,
        height: 1,
        bitDepth: 1,
        data: new Uint8Array(10),
        components: 3,
        alpha: false
      })
    ).toThrow('unsupported bit depth: 1');
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check(img: any, values: any): void {
  for (const prop in values) {
    expect(img[prop]).toBe(values[prop]);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkPngJs(data: any, values: any): void {
  const img = PNG.sync.read(Buffer.from(data, data.byteOffset, data.length));
  var newValues = Object.assign({}, values);
  if (newValues.bitDepth !== undefined) {
    newValues.depth = newValues.bitDepth;
    delete newValues.bitDepth;
  }
  if (newValues.colourType !== undefined) {
    newValues.colorType = newValues.colourType;
    delete newValues.colourType;
  }
  check(img, newValues);
}
