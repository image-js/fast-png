import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { rgb, IndexedColors, decode, encode, IndexedColorBitDepth } from '..';

describe('rgb', () => {
  it('1 bit', () => {
    const data = new Uint8Array([27]);
    const palette: IndexedColors = [
      [0, 0, 1],
      [0, 0, 2],
    ];

    const view = rgb(data, 1, palette);
    assert.strictEqual(
      Buffer.from(view).toString('hex'),
      '000001000001000001000002000002000001000002000002',
    );
  });

  it('2 bit', () => {
    const data = new Uint8Array([27]);
    const palette: IndexedColors = [
      [0, 0, 1],
      [0, 0, 2],
      [0, 0, 3],
      [0, 0, 4],
    ];

    const view = rgb(data, 2, palette);
    assert.strictEqual(
      Buffer.from(view).toString('hex'),
      '000001000002000003000004',
    );
  });

  it('4 bit', () => {
    const data = new Uint8Array([18, 52, 86, 120]);
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

    const view = rgb(data, 4, palette);
    assert.strictEqual(
      Buffer.from(view).toString('hex'),
      '000001000002000003000004000005000006000007000008',
    );
  });

  it('8 bit', () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const palette: IndexedColors = [
      [0, 0, 0],
      [0, 0, 1],
      [0, 0, 2],
      [0, 0, 3],
      [0, 0, 4],
    ];

    const view = rgb(data, 8, palette);
    assert.strictEqual(
      Buffer.from(view).toString('hex'),
      '000001000002000003000004',
    );
  });

  it('convert palette.png tp simple file', () => {
    const imgFile = fs.readFileSync(
      path.join(__dirname, '../../img/palette.png'),
    );
    const img = decode(imgFile);
    assert.ok(img.palette);
    assert.notStrictEqual(img.depth, 16);

    const data = rgb(
      img.data as Uint8Array,
      img.depth as IndexedColorBitDepth,
      img.palette,
    );
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
    assert.strictEqual(newImageParsed.data.byteLength, 90000);
  });
});
