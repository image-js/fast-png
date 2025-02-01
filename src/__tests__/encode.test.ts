// @ts-expect-error TS not defined but this is a test
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import type { ImageData } from '../index';
import { encode, decode } from '../index';

const simpleRGBAData = new Uint8Array([
  255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255,
]);
const simpleRGBAImageData: ImageData = {
  width: 2,
  height: 2,
  data: simpleRGBAData,
};

describe('encode', () => {
  it('simple RGBA', () => {
    const data = encode(simpleRGBAImageData);
    expect(data).toBeInstanceOf(Uint8Array);
    const decoded = decode(data);
    const expected = {
      width: 2,
      height: 2,
      depth: 8,
    };
    check(decoded, expected);
    checkPngJs(data, expected);
    expect(decoded.data).toBeInstanceOf(Uint8Array);
    expect(decoded.data).toStrictEqual(simpleRGBAData);
  });

  it('simple GREY', () => {
    const dataArray = new Uint8Array([0, 32, 64, 96, 127, 255]);
    const data = encode({
      width: 2,
      height: 3,
      data: dataArray,
      channels: 1,
    });
    expect(data).toBeInstanceOf(Uint8Array);
    const decoded = decode(data);
    const expected = {
      width: 2,
      height: 3,
      depth: 8,
    };
    check(decoded, expected);
    checkPngJs(data, expected);
    expect(decoded.data).toBeInstanceOf(Uint8Array);
    expect(decoded.data).toStrictEqual(dataArray);
  });

  it('RGB 16-bit', () => {
    const dataArray = new Uint16Array([
      65535, 65535, 65535, 0, 0, 0, 32768, 32768, 32768, 500, 500, 500,
    ]);
    const data = encode({
      width: 2,
      height: 2,
      depth: 16,
      data: dataArray,
      channels: 3,
    });
    expect(data).toBeInstanceOf(Uint8Array);
    const decoded = decode(data);
    const expected = {
      width: 2,
      height: 2,
      depth: 16,
    };
    check(decoded, expected);
    checkPngJs(data, expected);
    expect(decoded.data).toBeInstanceOf(Uint16Array);
    expect(decoded.data).toStrictEqual(dataArray);
  });

  it('GREYA 16-bit', () => {
    const dataArray = new Uint8Array([
      0, 0, 32, 127, 64, 255, 96, 0, 127, 127, 255, 255,
    ]);
    const data = encode({
      width: 2,
      height: 3,
      data: dataArray,
      channels: 2,
    });
    expect(data).toBeInstanceOf(Uint8Array);
    const decoded = decode(data);
    const expected = {
      width: 2,
      height: 3,
      depth: 8,
    };
    check(decoded, expected);
    checkPngJs(data, expected);
    expect(decoded.data).toBeInstanceOf(Uint8Array);
    expect(decoded.data).toStrictEqual(dataArray);
  });

  it('tEXt chunk', () => {
    const text = {
      Field1: 'Value1',
      'Field 2': 'Value 2',
      'Field:latin1': 'héhé',
    };
    const encoded = encode({ ...simpleRGBAImageData, text });
    const decoded = decode(encoded);
    expect(decoded.text).toStrictEqual(text);
  });

  it('tEXt chunk - invalid data', () => {
    expect(() =>
      encode({ ...simpleRGBAImageData, text: { 'InvalidK€yword': 'value' } }),
    ).toThrow('invalid latin1 text');
    expect(() =>
      encode({ ...simpleRGBAImageData, text: { key: 'InvalidValu€' } }),
    ).toThrow(/invalid latin1 text/);
    expect(() =>
      encode({
        ...simpleRGBAImageData,
        text: { ['keywordTooLong'.repeat(10)]: 'value' },
      }),
    ).toThrow(/keyword length/);
  });

  it('errors', () => {
    expect(() =>
      encode({
        width: 1,
        height: 1,
        depth: 8,
        data: new Uint8Array(),
        channels: 5,
      }),
    ).toThrow('unsupported number of channels: 5');
    expect(() =>
      encode({
        width: 1.1,
        height: 1,
        depth: 8,
        data: new Uint8Array(),
        channels: 3,
      }),
    ).toThrow('width must be a positive integer');
    expect(() =>
      encode({
        width: 1,
        // @ts-expect-error we want to test the error
        height: undefined,
        depth: 8,
        data: new Uint8Array(),
        channels: 3,
      }),
    ).toThrow('height must be a positive integer');
    expect(() =>
      encode({
        width: 1,
        height: 1,
        depth: 8,
        data: new Uint8Array(10),
        channels: 3,
      }),
    ).toThrow('wrong data size. Found 10, expected 3');
    expect(() =>
      encode({
        width: 1,
        height: 1,
        depth: 1,
        data: new Uint8Array(10),
        channels: 3,
      }),
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
  check(img, values);
}
