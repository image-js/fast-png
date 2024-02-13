import { IOBuffer } from 'iobuffer';

const latin1Decoder = new TextDecoder('latin1');

const NULL = 0;

const keywordRegex = /^[\x20-\x7e\xa1-\xff]+$/;

// https://www.w3.org/TR/png/#11keywords
export function readKeyword(buffer: IOBuffer): string {
  buffer.mark();
  while (buffer.readByte() !== NULL) {
    /* advance */
  }
  const end = buffer.offset;
  buffer.reset();
  const keyword = latin1Decoder.decode(
    buffer.readBytes(end - buffer.offset - 1),
  );
  // NULL
  buffer.skip(1);

  if (!keywordRegex.test(keyword)) {
    throw new Error(`keyword contains invalid characters: ${keyword}`);
  }

  return keyword;
}

export function readLatin1(buffer: IOBuffer, length: number): string {
  return latin1Decoder.decode(buffer.readBytes(length));
}
