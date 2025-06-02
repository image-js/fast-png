import type { IOBuffer } from 'iobuffer';

const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

const initialCrc = 0xffffffff;
function updateCrc(
  currentCrc: number,
  data: Uint8Array,
  length: number,
): number {
  let c = currentCrc;
  for (let n = 0; n < length; n++) {
    c = crcTable[(c ^ data[n]) & 0xff] ^ (c >>> 8);
  }
  return c;
}

function crc(data: Uint8Array, length: number): number {
  return (updateCrc(initialCrc, data, length) ^ initialCrc) >>> 0;
}

export function checkCrc(
  buffer: IOBuffer,
  crcLength: number,
  chunkName: string,
) {
  const expectedCrc = buffer.readUint32();
  const actualCrc = crc(
    new Uint8Array(
      buffer.buffer,
      buffer.byteOffset + buffer.offset - crcLength - 4,
      crcLength,
    ),
    crcLength,
  ); // "- 4" because we already advanced by reading the CRC
  if (actualCrc !== expectedCrc) {
    throw new Error(
      `CRC mismatch for chunk ${chunkName}. Expected ${expectedCrc}, found ${actualCrc}`,
    );
  }
}

export function writeCrc(buffer: IOBuffer, length: number) {
  buffer.writeUint32(
    crc(
      new Uint8Array(
        buffer.buffer,
        buffer.byteOffset + buffer.offset - length,
        length,
      ),
      length,
    ),
  );
}
