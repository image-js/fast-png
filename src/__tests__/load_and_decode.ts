import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { decode } from '../index.ts';
import type { DecodedPng, PngDecoderOptions } from '../types.ts';

export function loadAndDecode(
  img: string,
  options?: PngDecoderOptions,
): DecodedPng {
  return decode(
    readFileSync(join(import.meta.dirname, '../../img', img)),
    options,
  );
}
