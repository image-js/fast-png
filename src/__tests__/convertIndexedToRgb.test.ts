import { expect, describe, it } from 'vitest';

import { decode, encode } from '..';
import type { IndexedColors, DecodedPng } from '..';
import { convertIndexedToRgb } from '../convertIndexedToRgb';

import { loadAndDecode } from './decode.test';

describe('rgb', () => {
  it('1 bit', () => {
    const palette: IndexedColors = [[0, 0, 1]];
    const decodedImage: DecodedPng = {
      width: 1,
      height: 1,
      data: new Uint8Array([27]),
      depth: 1,
      palette,
      channels: 1,
      text: {},
    };
    const view = convertIndexedToRgb(decodedImage);
    expect(view).toStrictEqual(Uint8Array.from([0, 0, 1]));
  });

  it('2 bit', () => {
    const palette: IndexedColors = [
      [0, 0, 1],
      [0, 0, 4],
    ];
    const decodedImage: DecodedPng = {
      width: 2,
      height: 1,
      data: new Uint8Array([27]),
      depth: 2,
      palette,
      channels: 1,
      text: {},
    };

    const view = convertIndexedToRgb(decodedImage);
    expect(view).toStrictEqual(Uint8Array.from([0, 0, 1, 0, 0, 4]));
  });

  it('4 bit', () => {
    const palette: IndexedColors = [
      [0, 0, 0],
      [0, 0, 1],
      [0, 0, 2],
      [0, 0, 3],
      [0, 0, 4],
      [0, 0, 5],
      [0, 0, 6],
      [0, 0, 7],
      [0, 0, 8],
    ];

    const decodedImage: DecodedPng = {
      width: 8,
      height: 1,
      data: new Uint8Array([18, 52, 86, 120]),
      depth: 4,
      palette,
      channels: 1,
      text: {},
    };

    const view = convertIndexedToRgb(decodedImage);
    expect(view).toStrictEqual(
      Uint8Array.from([
        0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0, 5, 0, 0, 6, 0, 0, 7, 0, 0, 8,
      ]),
    );
  });

  it('8 bit', () => {
    const palette: IndexedColors = [
      [0, 0, 0],
      [0, 0, 1],
      [0, 0, 2],
      [0, 0, 3],
      [0, 0, 4],
    ];
    const decodedImage: DecodedPng = {
      width: 4,
      height: 1,
      data: new Uint8Array([1, 2, 3, 4]),
      depth: 8,
      palette,
      channels: 1,
      text: {},
    };

    const view = convertIndexedToRgb(decodedImage);
    expect(view).toStrictEqual(
      Uint8Array.from([0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4]),
    );
  });

  it('convert palette.png tp simple file', () => {
    const img = loadAndDecode('palette.png');

    expect(img.palette).toBeDefined();
    expect(img.depth).toStrictEqual(8);

    const data = convertIndexedToRgb(img);
    const newImg = encode({
      width: img.width,
      height: img.height,
      channels: 3,
      depth: 8,
      data,
    });
    // Uncomment the next line for manual testing
    // fs.writeFileSync(path.join(__dirname, "../../img/palette.new.png"), newImg, { flag: "w+" });

    const newImageParsed = decode(newImg);
    expect(newImageParsed.data.byteLength).toStrictEqual(90000);
  });
  it('minecraft texture with tRNS ', () => {
    const img = loadAndDecode('cocoa_stage2.png');
    expect(img.palette).toBeDefined();
    expect(img.depth).toStrictEqual(4);

    const data = convertIndexedToRgb(img);
    const newImg = encode({
      width: img.width,
      height: img.height,
      channels: 4,
      depth: 8,
      data,
    });
    // Uncomment the next line for manual testing
    // fs.writeFileSync(path.join(__dirname, "../../img/palette.new.png"), newImg, { flag: "w+" });

    const newImageParsed = decode(newImg);

    expect(newImageParsed.data.byteLength).toStrictEqual(1024);
  });
});
describe('rgba', () => {
  it('1 bit with RGBA', () => {
    const palette: IndexedColors = [
      [0, 0, 1, 255],
      [0, 0, 2, 255],
    ];
    const decodedImage: DecodedPng = {
      width: 8,
      height: 2,
      data: new Uint8Array([18, 52]),
      depth: 1,
      palette,
      channels: 1,
      text: {},
    };

    const view = convertIndexedToRgb(decodedImage);
    expect(view).toStrictEqual(
      Uint8Array.from(
        [
          [
            0, 0, 1, 255, 0, 0, 1, 255, 0, 0, 1, 255, 0, 0, 2, 255, 0, 0, 1,
            255, 0, 0, 1, 255, 0, 0, 2, 255, 0, 0, 1, 255,
          ],
          [
            0, 0, 1, 255, 0, 0, 1, 255, 0, 0, 2, 255, 0, 0, 2, 255, 0, 0, 1,
            255, 0, 0, 2, 255, 0, 0, 1, 255, 0, 0, 1, 255,
          ],
        ].flat(),
      ),
    );
  });
  it('4 bit with RGBA', () => {
    const palette: IndexedColors = [
      [0, 0, 0, 25],
      [0, 0, 1, 255],
      [0, 0, 2, 90],
      [0, 0, 3, 0],
      [0, 0, 4, 0],
      [0, 0, 5, 255],
      [0, 0, 6, 255],
      [0, 0, 7, 255],
      [0, 0, 8, 255],
    ];

    const decodedImage: DecodedPng = {
      width: 8,
      height: 1,
      data: new Uint8Array([18, 52, 86, 120]),
      depth: 4,
      palette,
      channels: 1,
      text: {},
    };

    const view = convertIndexedToRgb(decodedImage);
    expect(view).toStrictEqual(
      Uint8Array.from([
        0, 0, 1, 255, 0, 0, 2, 90, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 255, 0, 0,
        6, 255, 0, 0, 7, 255, 0, 0, 8, 255,
      ]),
    );
  });
});
describe('errors', () => {
  it('returns an error', () => {
    const decodedImage: DecodedPng = {
      width: 1,
      height: 1,
      data: new Uint8Array([27]),
      depth: 1,
      channels: 1,
      text: {},
    };
    expect(() => {
      convertIndexedToRgb(decodedImage);
    }).toThrow('Color palette is undefined.');
  });
  it('throws if data length is not correct', () => {
    const palette: IndexedColors = [
      [0, 0, 1],
      [0, 0, 4],
    ];
    const decodedImage: DecodedPng = {
      width: 2,
      height: 1,
      data: new Uint8Array([27, 22]),
      depth: 2,
      palette,
      channels: 1,
      text: {},
    };

    expect(() => {
      convertIndexedToRgb(decodedImage);
    }).toThrow(new RangeError('wrong data size. Found 2, expected 1'));
  });
});
