'use strict';

const InputBuffer = require('iobuffer').InputBuffer;
const inflate = require('pako').inflate;

const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

class PNGDecoder extends InputBuffer {
    constructor(data) {
        super(data);
        this._decoded = false;
        this._png = null;
        this._end = false;
        // PNG is always big endian
        // http://www.w3.org/TR/PNG/#7Integers-and-byte-order
        this.setBigEndian();
    }

    decode() {
        if (this._decoded) return this._png;
        this._png = {};
        this.readSignature();
        var chunkType;
        while (!this._end) {
            this.readChunk();
        }
        return this._png;
    }

    // http://www.w3.org/TR/PNG/#5PNG-file-signature
    readSignature() {
        for (var i = 0; i < 8; i++) {
            if (this.readUint8() !== pngSignature[i]) {
                throw new Error(`Wrong PNG signature. Byte at ${i} should be ${pngSignature[i]}.`);
            }
        }
    }

    // http://www.w3.org/TR/PNG/#5Chunk-layout
    readChunk() {
        var length = this.readUint32();
        var type = this.readChars(4);
        var offset = this.offset;
        switch (type) {
            case 'IHDR':
                this.readIHDR();
                break;
            case 'PLTE':
                throw new Error('Palette image type not supported');
            //case 'IDAT':
            //    this.readIDAT(length);
            //    break;
            case 'IEND':
                this._end = true;
                break;
            default:
                this.skip(length);
                break;
        }
        if (this.offset - offset !== length) {
            throw new Error('Length mismatch while reading chunk ' + type);
        }
        // TODO compute and validate CRC
        // http://www.w3.org/TR/PNG/#5CRC-algorithm
        var crc = this.readUint32();
    }

    // http://www.w3.org/TR/PNG/#11IHDR
    readIHDR() {
        var image = this._png;
        image.width = this.readUint32();
        image.height = this.readUint32();
        image.bitDepth = this.readUint8();
        image.colourType = this.readUint8();
        image.compressionMethod = this.readUint8();
        image.filterMethod = this.readUint8();
        image.interlaceMethod = this.readUint8();
    }

    // http://www.w3.org/TR/PNG/#11IDAT
    readIDAT(length) {
        if (image.compressionMethod !== 0) {
            throw new Error('Unsupported compression method: ' + image.compressionMethod);
        }
        var data = inflate(new Uint8Array(this.buffer, this.offset, length));

    }
}

module.exports = PNGDecoder;
