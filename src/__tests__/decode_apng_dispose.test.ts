import { expect, test } from 'vitest';

import { decodeApng } from '../index.ts';
import type { IndexedColors } from '../types.ts';

import {
  B,
  BACKGROUND,
  CLEAR,
  G,
  K,
  NONE,
  PREVIOUS,
  R,
  W,
  indexed,
  pixels,
  rgb,
  rgba,
} from './apng_fixtures.ts';
import { writeApng } from './write_apng.ts';

test('a frame smaller than the canvas is drawn over what the previous frame left', () => {
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [rgba(R, G, B), { ...rgba(W), xOffset: 1, disposeOp: NONE }],
    }),
  );

  expect(pixels(decoded)).toStrictEqual([
    [...R, ...G, ...B],
    [...R, ...W, ...B],
  ]);
});

test('dispose_op background clears the region of the frame before the next one', () => {
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [
        rgba(R, G, B),
        { ...rgba(W), xOffset: 1, disposeOp: BACKGROUND },
        { ...rgba(K), xOffset: 0 },
      ],
    }),
  );

  expect(pixels(decoded)).toStrictEqual([
    [...R, ...G, ...B],
    [...R, ...W, ...B],
    [...K, ...CLEAR, ...B],
  ]);
});

test('dispose_op previous gives the region back what it held before the frame', () => {
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [
        rgba(R, G, B),
        { ...rgba(W), xOffset: 1, disposeOp: PREVIOUS },
        { ...rgba(K), xOffset: 2 },
      ],
    }),
  );

  expect(pixels(decoded)).toStrictEqual([
    [...R, ...G, ...B],
    [...R, ...W, ...B],
    [...R, ...G, ...K],
  ]);
});

test('dispose_op previous on the first frame clears it, as background does', () => {
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [
        { ...rgba(R, G, B), disposeOp: PREVIOUS },
        { ...rgba(W), xOffset: 1 },
      ],
    }),
  );

  expect(pixels(decoded)[1]).toStrictEqual([...CLEAR, ...W, ...CLEAR]);
});

test('a default image outside the animation is not one of its frames', () => {
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      hiddenDefaultImage: rgba(K, K, K).image,
      frames: [rgba(R, G, B), { ...rgba(W), xOffset: 1 }],
    }),
  );

  expect(decoded.numberOfFrames).toBe(2);
  expect(pixels(decoded)).toStrictEqual([
    [...R, ...G, ...B],
    [...R, ...W, ...B],
  ]);
});

test('a frame of an indexed image packed below eight bits lands on its own pixels', () => {
  const palette: IndexedColors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [0, 0, 0],
  ];
  const decoded = decodeApng(
    writeApng({
      width: 3,
      height: 1,
      frames: [
        indexed(palette, 2, 0, 1, 2),
        { ...indexed(palette, 2, 3), xOffset: 1 },
      ],
    }),
  );

  // Two bits a pixel, from the high bits: 00 01 10 00, then 00 11 10 00.
  expect(pixels(decoded)).toStrictEqual([[0b0001_1000], [0b0011_1000]]);
});

test('a 16-bit frame smaller than the canvas lands on its own pixels', () => {
  const red = [65_535, 0, 0];
  const green = [0, 65_535, 0];
  const blue = [0, 0, 65_535];
  const white = [65_535, 65_535, 65_535];
  const black = [0, 0, 0];
  const decoded = decodeApng(
    writeApng({
      width: 2,
      height: 2,
      frames: [
        {
          image: {
            ...rgb(16, red, green, blue, black).image,
            width: 2,
            height: 2,
          },
        },
        { ...rgb(16, white), xOffset: 1, yOffset: 1 },
      ],
    }),
  );

  expect(pixels(decoded)[1]).toStrictEqual([
    ...red,
    ...green,
    ...blue,
    ...white,
  ]);
});
