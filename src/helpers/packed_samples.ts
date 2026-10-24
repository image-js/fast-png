import type { BitDepth, PngDataArray } from '../types.ts';

/**
 * One sample an element, from rows packed below eight bits.
 * @param data - The rows, each starting on a byte.
 * @param rowSamples - Samples in a row.
 * @param height - Rows.
 * @param depth - Bits a sample.
 * @returns The samples; `data` itself at eight bits and above.
 */
export function unpack(
  data: PngDataArray,
  rowSamples: number,
  height: number,
  depth: BitDepth,
): PngDataArray {
  if (depth >= 8) return data;
  const rowBytes = Math.ceil((rowSamples * depth) / 8);
  const mask = (1 << depth) - 1;
  const samples = new Uint8Array(rowSamples * height);
  for (let row = 0; row < height; row++) {
    for (let sample = 0; sample < rowSamples; sample++) {
      const bit = sample * depth;
      const byte = data[row * rowBytes + (bit >> 3)];
      samples[row * rowSamples + sample] =
        (byte >> (8 - depth - (bit & 7))) & mask;
    }
  }
  return samples;
}

/**
 * Rows packed below eight bits, from one sample an element.
 * @param samples - The samples.
 * @param rowSamples - Samples in a row.
 * @param height - Rows.
 * @param depth - Bits a sample.
 * @returns The packed rows; a copy of `samples` at eight bits and above.
 */
export function pack(
  samples: PngDataArray,
  rowSamples: number,
  height: number,
  depth: BitDepth,
): PngDataArray {
  if (depth >= 8) return samples.slice();
  const rowBytes = Math.ceil((rowSamples * depth) / 8);
  const data = new Uint8Array(rowBytes * height);
  for (let row = 0; row < height; row++) {
    for (let sample = 0; sample < rowSamples; sample++) {
      const bit = sample * depth;
      data[row * rowBytes + (bit >> 3)] |=
        samples[row * rowSamples + sample] << (8 - depth - (bit & 7));
    }
  }
  return data;
}
