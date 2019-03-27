/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "loadAndDecode"] }] */

import { join } from 'path';
import { readFileSync } from 'fs';

import { decode, IPNGDecoderOptions, IDecodedPNG } from '../index';

describe('decode', () => {
  it('BW2x2', () => {
    const img = loadAndDecode('BW2x2.png');
    check(img, {
      width: 2,
      height: 2,
      bitDepth: 8,
      colourType: 4
    });
    expect(img.data).toBeInstanceOf(Uint8Array);
    expect(img.data).toStrictEqual(
      new Uint8Array([0, 255, 255, 255, 255, 255, 0, 255])
    );
  });

  it('ColorGrid5x5', () => {
    const img = loadAndDecode('ColorGrid5x5.png');
    check(img, {
      width: 10,
      height: 10,
      bitDepth: 8,
      colourType: 6
    });
    expect(img.data).toBeInstanceOf(Uint8Array);
    expect(img.data).toHaveLength(10 * 10 * 4);
  });

  it('palette', () => {
    const img = loadAndDecode('palette.png');
    check(img, {
      width: 150,
      height: 200,
      bitDepth: 8,
      colourType: 3
    });
    expect(img.palette).toBeInstanceOf(Array);
    expect(img.palette).toHaveLength(256);
    // @ts-ignore
    expect(img.palette[0]).toStrictEqual([124, 124, 124]);
  });

  it('should not throw when CRC is correct', () => {
    loadAndDecode('palette.png', { checkCrc: true });
  });

  it('should throw with a non-png', () => {
    expect(() => decode(new Uint8Array(20))).toThrow(
      'wrong PNG signature. Byte at 0 should be 137.'
    );
  });
});

function loadAndDecode(img: string, options?: IPNGDecoderOptions): IDecodedPNG {
  return decode(readFileSync(join(__dirname, '../../img', img)), options);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check(img: any, values: any): void {
  for (const prop in values) {
    expect(img[prop]).toBe(values[prop]);
  }
}
