import type { IOBuffer } from 'iobuffer';

import { writeCrc } from './crc.ts';

// https://www.w3.org/TR/png/#11tEXt

export const textChunkName = 'tEXt';

const NULL = 0;

// TextDecoder('latin1') is not available in every runtime, and per the WHATWG
// Encoding standard it decodes as windows-1252 instead of ISO 8859-1.
const CHUNK_SIZE = 0x2000;
function decodeLatin1(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    result += String.fromCodePoint(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return result;
}

function validateKeyword(keyword: string) {
  validateLatin1(keyword);
  if (keyword.length === 0 || keyword.length > 79) {
    throw new Error('keyword length must be between 1 and 79');
  }
}

// eslint-disable-next-line no-control-regex
const latin1Regex = /^[\u0000-\u00FF]*$/;
function validateLatin1(text: string) {
  if (!latin1Regex.test(text)) {
    throw new Error('invalid latin1 text');
  }
}

export function decodetEXt(
  text: Record<string, string>,
  buffer: IOBuffer,
  length: number,
) {
  const keyword = readKeyword(buffer);
  text[keyword] = readLatin1(buffer, length - keyword.length - 1);
}

export function encodetEXt(buffer: IOBuffer, keyword: string, text: string) {
  validateKeyword(keyword);
  validateLatin1(text);
  const length = keyword.length + 1 /* NULL */ + text.length;

  buffer.writeUint32(length);
  buffer.writeChars(textChunkName);
  buffer.writeChars(keyword);
  buffer.writeByte(NULL);
  buffer.writeChars(text);
  writeCrc(buffer, length + 4);
}

// https://www.w3.org/TR/png/#11keywords
export function readKeyword(buffer: IOBuffer): string {
  buffer.mark();
  while (buffer.readByte() !== NULL) {
    /* advance */
  }
  const end = buffer.offset;
  buffer.reset();
  const keyword = decodeLatin1(buffer.readBytes(end - buffer.offset - 1));
  // NULL
  buffer.skip(1);

  validateKeyword(keyword);

  return keyword;
}

export function readLatin1(buffer: IOBuffer, length: number): string {
  return decodeLatin1(buffer.readBytes(length));
}
