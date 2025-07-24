import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { assert, describe, expect, it } from 'vitest';

import type { DecodedApng, PngDecoderOptions } from '../index.ts';
import { decode, decodeApng } from '../index.ts';

import { loadAndDecode } from './load_and_decode.js';

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

  it('interlaced', () => {
    const image = loadAndDecode('ColorGrid5x5-interlaced.png');
    check(image, {
      width: 5,
      height: 5,
      depth: 8,
      channels: 3,
    });

    expect(image.data).toStrictEqual(
      new Uint8Array([
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255,
        0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 255, 255, 255, 0,
        0, 0, 255, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 0, 0,
        0, 255, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0,
      ]),
    );

    const image2 = loadAndDecode('interlaced.png');

    check(image2, {
      width: 817,
      height: 1057,
      depth: 8,
      channels: 4,
    });

    const image3 = loadAndDecode('16bitInterlace2x2.png');
    check(image3, {
      width: 2,
      height: 2,
      depth: 16,
      channels: 3,
    });
    const image4 = loadAndDecode('16bitInterlace10x10.png');
    check(image4, {
      width: 10,
      height: 10,
      depth: 16,
      channels: 1,
    });
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
    // @ts-expect-error Palette should not be undefined
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
    // @ts-expect-error Palette should not be undefined
    expect(img.palette[0]).toStrictEqual([71, 112, 76, 0]);
    // @ts-expect-error Palette should not be undefined
    expect(img.palette[255]).toStrictEqual([98, 185, 201, 255]);
  });

  it('16-bit grey image with tRNS', () => {
    const img = loadAndDecode('trns_grey_16bit.png');
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

  it('1bit depth ', () => {
    const decoded = loadAndDecode('bwImage.png');

    expect(decoded.data).toBeInstanceOf(Uint8Array);
    // Width of 225/8 = 28.125 so we need 29 bytes. Last pixel will fit on
    // the 29th byte.
    expect(decoded.data).toHaveLength(6525);
    expect(decoded.data[28]).toBe(128);
    expect(decoded.data[57]).toBe(128);
  });

  it('should not throw when CRC is correct', () => {
    expect(() =>
      loadAndDecode('palette.png', { checkCrc: true }),
    ).not.toThrow();
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
    const img = loadAndDecode('icc_profile.png');
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
    const { text } = loadAndDecode('note.png');

    expect(text).toStrictEqual({
      Note: 'Distance to target [Km]: 10',
    });
  });

  it('tEXt chunk - ASCII 2', () => {
    const { text } = loadAndDecode('text-ascii.png');

    expect(text).toStrictEqual({
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
    const { text } = loadAndDecode('text-excalidraw.png');

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
    const decodedApng = loadAndDecodeApng('testApng.png');

    expect(decodedApng).toBeDefined();
    expect(decodedApng.frames).toHaveLength(2);

    const frame1 = decodedApng.frames.at(0);
    const frame2 = decodedApng.frames.at(1);

    expect(frame1?.data.length).toBe(200);
    expect(frame2?.data.length).toBe(200);
    expect(frame1?.data.slice(0, 11)).toStrictEqual(
      new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]),
    );
    expect(frame2?.data.slice(0, 11)).toStrictEqual(
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255]),
    );
  });

  it('APNG big RGBA image', () => {
    const decodedApng = loadAndDecodeApng('beachBallApng.png');

    expect(decodedApng).toBeDefined();
    expect(decodedApng.frames).toHaveLength(decodedApng.numberOfFrames);

    expect(decodedApng.frames[0].data).toHaveLength(40000);

    const frame1 = decodedApng.frames.at(0);
    const frame2 = decodedApng.frames.at(1);
    assert(frame1 && frame2);

    expect(frame1.data.slice(0, 11)).toStrictEqual(
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    );
    expect(frame2.data).toHaveLength(
      decodedApng.width * decodedApng.height * decodedApng.channels,
    );
  });

  it('Minecraft texture with PLTE', () => {
    const decoded = loadAndDecode('polished_basalt_side.png');

    expect(decoded.width).toBe(16);
    expect(decoded.height).toBe(16);
    expect(decoded.data).toHaveLength(128);
    expect(decoded.palette).toBeDefined();
    expect(decoded.palette?.length).toBe(6);
    expect(decoded.palette?.at(0)).toStrictEqual([116, 116, 116]);
  });

  it('Minecraft texture with PLTE and tRNS', () => {
    const decoded = loadAndDecode('cocoa_stage2.png');

    expect(decoded.width).toBe(16);
    expect(decoded.height).toBe(16);
    expect(decoded.data).toHaveLength(128);
    expect(decoded.data.at(7)).toBe(18);
    expect(decoded.palette).toBeDefined();
    expect(decoded.palette?.length).toBe(8);
    expect(decoded.palette?.at(0)).toStrictEqual([0, 0, 0, 0]);
    expect(decoded.palette?.at(1)).toStrictEqual([226, 177, 124, 255]);
  });

  it('Minecraft texture with PLTE and bitDepth 2', () => {
    const decoded = loadAndDecode('blue_concrete.png');

    expect(decoded.width).toBe(160);
    expect(decoded.height).toBe(160);
    expect(decoded.data).toHaveLength(6400);
    expect(decoded.data.at(1)).toBe(170);
    expect(decoded.palette).toBeDefined();
    expect(decoded.palette?.length).toBe(4);
    expect(decoded.palette?.at(0)).toStrictEqual([44, 46, 142]);
    expect(decoded.palette?.at(1)).toStrictEqual([44, 46, 143]);
  });

  it('APNG RGB square 8-bit image', () => {
    const decodedApng = loadAndDecodeApng('squareApng.png');

    expect(decodedApng).toBeDefined();
    expect(decodedApng.frames).toHaveLength(decodedApng.numberOfFrames);
    expect(decodedApng.frames[0].data).toHaveLength(25);

    const frame1 = decodedApng.frames.at(0);
    const frame2 = decodedApng.frames.at(1);
    assert(frame1 && frame2);

    expect(frame1.data).toStrictEqual(
      new Uint8Array([
        1, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1,
        1,
      ]),
    );
    expect(frame2.data).toStrictEqual(
      new Uint8Array([
        2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2,
        2,
      ]),
    );
    expect(decodedApng.palette?.length).toBe(3);
    expect(decodedApng.palette?.at(1)).toStrictEqual([0, 0, 255, 255]);
    expect(decodedApng.palette?.at(2)).toStrictEqual([255, 0, 0, 255]);
  });

  it('APNG RGB blend 8-bit image', () => {
    const decodedApng = loadAndDecodeApng('blendOpApng.png');

    expect(decodedApng.frames).toHaveLength(decodedApng.numberOfFrames);
    expect(decodedApng.frames[0].data[0]).toBe(255);
    expect(decodedApng.frames[110].data[1]).toBe(1);
  });

  it('APNG RGBA image with multiple data chunks per frame', async () => {
    const decodedApng = loadAndDecodeApng('rickApng.png');

    expect(decodedApng.frames).toHaveLength(decodedApng.numberOfFrames);
    expect(decodedApng.width).toBe(1300);
    expect(decodedApng.height).toBe(1300);
  }, 6000);

  it('decode APNG image as PNG', () => {
    const decodedPng = loadAndDecode('beachBallApng.png');

    expect(decodedPng.data).toBeDefined();
    expect(decodedPng.width).toBe(100);
    expect(decodedPng.height).toBe(100);
  });

  it('decode PNG image as APNG', () => {
    const decodedApng = loadAndDecodeApng('palette.png');

    expect(decodedApng.frames[0]).toBeDefined();
    expect(decodedApng.frames).toHaveLength(decodedApng.numberOfFrames);
    expect(decodedApng.width).toBe(150);
    expect(decodedApng.height).toBe(200);
  });
});

function loadAndDecodeApng(
  img: string,
  options?: PngDecoderOptions,
): DecodedApng {
  return decodeApng(
    readFileSync(join(import.meta.dirname, '../../img', img)),
    options,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check(img: any, values: any): void {
  for (const prop in values) {
    expect(img[prop]).toBe(values[prop]);
  }
}
