import { readFileSync } from 'fs';
import { join } from 'path';

import { decode, PngDecoderOptions, DecodedPng } from '../index';

describe('decode', () => {
  it('BW2x2', () => {
    const img = loadAndDecode('BW2x2.png');
    check(img, {
      width: 2,
      height: 2,
      depth: 8,
      channels: 2,
    });
    expect(img.data).toBeInstanceOf(Uint8Array);
    expect(img.data).toStrictEqual(
      new Uint8Array([0, 255, 255, 255, 255, 255, 0, 255]),
    );
  });

  it('ColorGrid5x5', () => {
    const img = loadAndDecode('ColorGrid5x5.png');
    check(img, {
      width: 10,
      height: 10,
      depth: 8,
      channels: 4,
    });
    expect(img.data).toBeInstanceOf(Uint8Array);
    expect(img.data).toHaveLength(10 * 10 * 4);
  });

  it('palette', () => {
    const img = loadAndDecode('palette.png');
    check(img, {
      width: 150,
      height: 200,
      depth: 8,
      channels: 1,
    });
    expect(img.palette).toBeInstanceOf(Array);
    expect(img.palette).toHaveLength(256);
    // @ts-ignore
    expect(img.palette[0]).toStrictEqual([124, 124, 124]);
  });

  it('palette with tRNS', () => {
    const img = loadAndDecode('palette_trns.png');
    check(img, {
      width: 1300,
      height: 1300,
      depth: 8,
      channels: 1,
    });
    expect(img.palette).toBeInstanceOf(Array);
    expect(img.palette).toHaveLength(256);
    // @ts-ignore
    expect(img.palette[0]).toStrictEqual([71, 112, 76, 0]);
    // @ts-ignore
    expect(img.palette[255]).toStrictEqual([98, 185, 201, 255]);
  });

  it('should not throw when CRC is correct', () => {
    loadAndDecode('palette.png', { checkCrc: true });
  });

  it('should throw with a non-png', () => {
    expect(() => decode(new Uint8Array(20))).toThrow(
      'wrong PNG signature. Byte at 0 should be 137.',
    );
  });

  it('ICC Embeded Profile', () => {
    const img = loadAndDecode('icc_profile.png');
    check(img, {
      width: 512,
      height: 512,
      depth: 8,
      channels: 3,
    });
    expect(img.iccEmbeddedProfile).not.toBeNull()
    expect(img.iccEmbeddedProfile?.name).toBe("ICC profile")
    expect(img.iccEmbeddedProfile?.profile).toHaveLength(672)
  });


});

function loadAndDecode(img: string, options?: PngDecoderOptions): DecodedPng {
  return decode(readFileSync(join(__dirname, '../../img', img)), options);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check(img: any, values: any): void {
  for (const prop in values) {
    expect(img[prop]).toBe(values[prop]);
  }
}
