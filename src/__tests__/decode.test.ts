import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { PngDecoderOptions, DecodedPng } from '../index';
import { decode } from '../index';

describe('decode', () => {
  it('BW2x2', () => {
    const img = loadAndDecode('BW2x2.png') as DecodedPng;
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

  it('interlaced', () => {
    const image = loadAndDecode('ColorGrid5x5-interlaced.png') as DecodedPng;
    check(image, {
      width: 5,
      height: 5,
      depth: 8,
      channels: 3,
    });
    expect(image.data).toEqual(
      new Uint8Array([
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255,
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 255, 255, 255, 0,
        0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 0, 0,
        0, 255, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0,
      ]),
    );

    const image2 = loadAndDecode('interlaced.png') as DecodedPng;
    check(image2, {
      width: 817,
      height: 1057,
      depth: 8,
      channels: 4,
    });

    const image3 = loadAndDecode('16bitInterlace2x2.png') as DecodedPng;
    check(image3, {
      width: 2,
      height: 2,
      depth: 16,
      channels: 3,
    });
    const image4 = loadAndDecode('16bitInterlace10x10.png') as DecodedPng;
    check(image4, {
      width: 10,
      height: 10,
      depth: 16,
      channels: 1,
    });
  });

  it('ColorGrid5x5', () => {
    const img = loadAndDecode('ColorGrid5x5.png') as DecodedPng;
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
    const img = loadAndDecode('palette.png') as DecodedPng;
    check(img, {
      width: 150,
      height: 200,
      depth: 8,
      channels: 1,
    });
    expect(img.palette).toBeInstanceOf(Array);
    expect(img.palette).toHaveLength(256);
    // @ts-expect-error Palette should not be undefined
    expect(img.palette[0]).toStrictEqual([124, 124, 124]);
  });

  it('palette with tRNS', () => {
    const img = loadAndDecode('palette_trns.png') as DecodedPng;
    check(img, {
      width: 1300,
      height: 1300,
      depth: 8,
      channels: 1,
    });
    expect(img.palette).toBeInstanceOf(Array);
    expect(img.palette).toHaveLength(256);
    // @ts-expect-error Palette should not be undefined
    expect(img.palette[0]).toStrictEqual([71, 112, 76, 0]);
    // @ts-expect-error Palette should not be undefined
    expect(img.palette[255]).toStrictEqual([98, 185, 201, 255]);
  });

  it('16-bit grey image with tRNS', () => {
    const img = loadAndDecode('trns_grey_16bit.png') as DecodedPng;
    check(img, {
      width: 256,
      height: 256,
      depth: 16,
      channels: 1,
    });
    expect(img.transparency).toBeInstanceOf(Uint16Array);
    expect(img.transparency).toHaveLength(1);
    // @ts-expect-error Transparency should not be undefined
    expect(img.transparency[0]).toBe(0);
  });

  it('should not throw when CRC is correct', () => {
    loadAndDecode('palette.png', { checkCrc: true });
  });

  it.each([
    // Enough values, last one is wrong.
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 9, 0, 0, 0),
    // Not enough values.
    Uint8Array.of(137, 80),
  ])('should throw with a non-png', (value) => {
    expect(() => decode(value)).toThrow('wrong PNG signature');
  });

  it('ICC Embeded Profile', () => {
    const img = loadAndDecode('icc_profile.png') as DecodedPng;
    check(img, {
      width: 512,
      height: 512,
      depth: 8,
      channels: 3,
    });
    assert(img.iccEmbeddedProfile);
    expect(img.iccEmbeddedProfile.name).toBe('ICC profile');
    expect(img.iccEmbeddedProfile.profile).toHaveLength(672);
  });

  it('tEXt chunk - ASCII', () => {
    const { text } = loadAndDecode('note.png') as DecodedPng;
    expect(text).toStrictEqual({
      Note: 'Distance to target [Km]: 10',
    });
  });

  it('tEXt chunk - ASCII', () => {
    const { text } = loadAndDecode('text-ascii.png') as DecodedPng;
    expect(text).toEqual({
      Smiles: 'CCCC',
      'date:create': '2024-02-12T15:56:01+00:00',
      'date:modify': '2024-02-12T15:55:48+00:00',
      'date:timestamp': '2024-02-12T16:04:26+00:00',
      'exif:ExifOffset': '78, ',
      'exif:PixelXDimension': '175, ',
      'exif:PixelYDimension': '51, ',
    });
  });

  it('tEXt chunk - latin1', () => {
    const { text } = loadAndDecode('text-excalidraw.png') as DecodedPng;
    expect(text).toHaveProperty(['application/vnd.excalidraw+json']);
    const json = JSON.parse(text['application/vnd.excalidraw+json']);
    expect(json).toMatchObject({
      version: '1',
      encoding: 'bstring',
      compressed: true,
    });

    // Binary string that we don't know how to interpret.
    expect(json.encoded).toHaveLength(654);
  });

  it('APNG small greyscale image', () => {
    const decodedApng = loadAndDecode('testApng.png') as DecodedPng[];
    expect(decodedApng).toBeDefined();
    expect(decodedApng.length).toStrictEqual(2);

    const frame1 = decodedApng.at(0);
    const frame2 = decodedApng.at(1);

    expect(frame1?.data.length).toEqual(200);
    expect(frame2?.data.length).toEqual(200);
    expect(frame1?.data.slice(0, 11)).toStrictEqual(
      new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]),
    );
    expect(frame2?.data.slice(0, 11)).toStrictEqual(
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255]),
    );
  });
  it('APNG big RGBA image', () => {
    const decodedApng = loadAndDecode('beachBall.png') as DecodedPng[];
    expect(decodedApng).toBeDefined();
    expect(decodedApng.length).toStrictEqual(20);
    expect(decodedApng[0].data.length).toEqual(40000);

    const frame1 = decodedApng.at(0);
    const frame2 = decodedApng.at(1);
    if (frame1 && frame2) {
      expect(frame1.data.slice(0, 11)).toStrictEqual(
        new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      );
      expect(frame2.data.length).toEqual(
        frame2.width * frame2.height * frame2.channels,
      );
    }
  });
  it('APNG GREY interlaced 8 bit image', () => {
    const decodedApng = loadAndDecode('8bitInterlaceApng.png') as DecodedPng[];
    expect(decodedApng).toBeDefined();
    expect(decodedApng.length).toStrictEqual(4);
    expect(decodedApng[0].data.length).toEqual(25);
    const frame1 = decodedApng.at(0);
    const frame2 = decodedApng.at(1);
    const frame3 = decodedApng.at(2);
    if (frame1 && frame2 && frame3) {
      expect(frame1.data).toStrictEqual(
        new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 0, 0, 0, 255,
          255, 0, 0, 0,
        ]),
      );
      expect(frame2.data).toEqual(
        new Uint8Array([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 0, 0,
          0, 255, 255,
        ]),
      );
    }
  });
});

function loadAndDecode(
  img: string,
  options?: PngDecoderOptions,
): DecodedPng | DecodedPng[] {
  return decode(readFileSync(join(__dirname, '../../img', img)), options);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check(img: any, values: any): void {
  for (const prop in values) {
    expect(img[prop]).toBe(values[prop]);
  }
}
