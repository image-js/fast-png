import { IOBuffer } from 'iobuffer';

import { writeCrc } from '../helpers/crc.ts';
import { encode } from '../index.ts';
import type { ImageData } from '../types.ts';

/** One frame of an APNG to write: its pixels and its frame control. */
export interface ApngFrameToWrite {
  /** The frame's own pixels, encoded as fast-png encodes any image. */
  image: ImageData;
  xOffset?: number;
  yOffset?: number;
  /** 0 none, 1 background, 2 previous. */
  disposeOp?: number;
  /** 0 source, 1 over. */
  blendOp?: number;
}

/** An APNG to write, with every frame control spelled out. */
export interface ApngToWrite {
  width: number;
  height: number;
  frames: ApngFrameToWrite[];
  /**
   * A default image that is not part of the animation: written as the IDAT,
   * before the first fcTL.
   */
  hiddenDefaultImage?: ImageData;
}

/**
 * Write an APNG whose frame controls are exactly the ones asked for, so a
 * test can exercise each dispose and blend operation. Each frame is encoded by
 * fast-png on its own, and its image data moved into an IDAT or an fdAT.
 * @param apng - The animation.
 * @returns The file.
 */
export function writeApng(apng: ApngToWrite): Uint8Array {
  const [first] = apng.frames;
  if (!first) throw new Error('An APNG needs at least one frame');
  const header = chunksOf(encode(first.image));
  const out = new IOBuffer();
  out.setBigEndian();
  out.writeBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = new IOBuffer(header.IHDR[0]);
  ihdr.setBigEndian();
  ihdr.writeUint32(apng.width);
  ihdr.writeUint32(apng.height);
  writeChunk(out, 'IHDR', ihdr.toArray());
  for (const type of ['PLTE', 'tRNS']) {
    for (const data of header[type] ?? []) writeChunk(out, type, data);
  }

  const actl = new IOBuffer(8);
  actl.setBigEndian();
  actl.writeUint32(apng.frames.length);
  actl.writeUint32(0);
  writeChunk(out, 'acTL', actl.toArray());

  if (apng.hiddenDefaultImage) {
    for (const data of chunksOf(encode(apng.hiddenDefaultImage)).IDAT) {
      writeChunk(out, 'IDAT', data);
    }
  }

  let sequence = 0;
  for (const [index, frame] of apng.frames.entries()) {
    const fctl = new IOBuffer(26);
    fctl.setBigEndian();
    fctl.writeUint32(sequence++);
    fctl.writeUint32(frame.image.width);
    fctl.writeUint32(frame.image.height);
    fctl.writeUint32(frame.xOffset ?? 0);
    fctl.writeUint32(frame.yOffset ?? 0);
    fctl.writeUint16(1);
    fctl.writeUint16(10);
    fctl.writeUint8(frame.disposeOp ?? 0);
    fctl.writeUint8(frame.blendOp ?? 0);
    writeChunk(out, 'fcTL', fctl.toArray());

    const idat = chunksOf(encode(frame.image)).IDAT;
    const isDefaultImage = index === 0 && !apng.hiddenDefaultImage;
    for (const data of idat) {
      if (isDefaultImage) {
        writeChunk(out, 'IDAT', data);
      } else {
        const fdat = new IOBuffer(data.length + 4);
        fdat.setBigEndian();
        fdat.writeUint32(sequence++);
        fdat.writeBytes(data);
        writeChunk(out, 'fdAT', fdat.toArray());
      }
    }
  }
  writeChunk(out, 'IEND', new Uint8Array(0));
  return out.toArray();
}

function chunksOf(png: Uint8Array): Record<string, Uint8Array[]> {
  const buffer = new IOBuffer(png);
  buffer.setBigEndian();
  buffer.skip(8);
  const chunks: Record<string, Uint8Array[]> = {};
  while (buffer.available(12)) {
    const length = buffer.readUint32();
    const type = buffer.readChars(4);
    const data = buffer.readBytes(length);
    buffer.skip(4);
    (chunks[type] ??= []).push(data);
  }
  return chunks;
}

function writeChunk(out: IOBuffer, type: string, data: Uint8Array): void {
  out.writeUint32(data.length);
  out.writeChars(type);
  out.writeBytes(data);
  writeCrc(out, data.length + 4);
}
