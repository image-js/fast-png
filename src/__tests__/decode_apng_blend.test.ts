import { expect, test } from 'vitest';

import { decodeApng } from '../index.ts';
import type { IndexedColors } from '../types.ts';

import {
  B,
  CLEAR,
  G,
  K,
  OVER,
  R,
  W,
  indexed,
  pixels,
  rgb,
  rgba,
} from './apng_fixtures.ts';
import { writeApng } from './write_apng.ts';

test('blend_op over mixes a translucent frame in, as the PNG specification writes it', () => {
  const halfRed = [255, 0, 0, 128];
  const halfBlack = [0, 0, 0, 128];
  const halfBlue = [0, 0, 255, 128];
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [
        rgba(R, G, halfRed),
        { ...rgba(halfBlack, halfBlue), xOffset: 1, blendOp: OVER },
      ],
    }),
  );

  // αo = αs + αd(1 − αs) and Co = (Cs·αs + Cd·αd·(1 − αs)) / αo, rounded:
  // half black over green, then half blue over half red.
  const darkGreen = [0, 127, 0, 255];
  const purple = [85, 0, 170, 192];

  expect(pixels(decoded)[1]).toStrictEqual([...R, ...darkGreen, ...purple]);
});

test('blend_op over shows the canvas through a transparent pixel, and the frame over a transparent one', () => {
  const invisible = [255, 255, 255, 0];
  const halfGreen = [0, 255, 0, 128];
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [
        rgba(R, CLEAR, B),
        { ...rgba(invisible, halfGreen), blendOp: OVER },
      ],
    }),
  );

  expect(pixels(decoded)[1]).toStrictEqual([...R, ...halfGreen, ...B]);
});

test('blend_op over on a frame as large as the canvas lets the canvas show through', () => {
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [rgba(R, G, B), { ...rgba(CLEAR, W, CLEAR), blendOp: OVER }],
    }),
  );

  expect(pixels(decoded)[1]).toStrictEqual([...R, ...W, ...B]);
});

test('blend_op over on an image without alpha draws the frame as source does', () => {
  const [red, green, blue, white, black] = [R, G, B, W, K].map((color) =>
    color.slice(0, 3),
  );
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [
        rgb(8, red, green, blue),
        { ...rgb(8, white), xOffset: 1, blendOp: OVER },
        { ...rgb(8, black), xOffset: 2, blendOp: OVER },
      ],
    }),
  );

  expect(pixels(decoded)).toStrictEqual([
    [...red, ...green, ...blue],
    [...red, ...white, ...blue],
    [...red, ...white, ...black],
  ]);
});

test('blend_op over on an indexed image keeps what is under a transparent index', () => {
  // Index 0 is the transparent one.
  const palette: IndexedColors = [
    [0, 0, 0, 0],
    [255, 0, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
  ];
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [
        indexed(palette, 8, 1, 2, 3),
        { ...indexed(palette, 8, 0, 1), xOffset: 1, blendOp: OVER },
      ],
    }),
  );

  expect(pixels(decoded)).toStrictEqual([
    [1, 2, 3],
    [1, 2, 1],
  ]);
});
