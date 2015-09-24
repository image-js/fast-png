'use strict';

const InputBuffer = require('iobuffer').InputBuffer;
const Inflator = require('pako').Inflate;

const empty = new Uint8Array(0);
const NULL = '\0';
const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

class PNGDecoder extends InputBuffer {
    constructor(data) {
        super(data);
        this._decoded = false;
        this._inflator = new Inflator();
        this._png = null;
        this._end = false;
        // PNG is always big endian
        // http://www.w3.org/TR/PNG/#7Integers-and-byte-order
        this.setBigEndian();
    }

    decode() {
        if (this._decoded) return this._png;
        this._png = {
            tEXt: {}
        };
        this.decodeSignature();
        while (!this._end) {
            this.decodeChunk();
        }
        this.decodeImage();
        return this._png;
    }

    // http://www.w3.org/TR/PNG/#5PNG-file-signature
    decodeSignature() {
        for (var i = 0; i < 8; i++) {
            if (this.readUint8() !== pngSignature[i]) {
                throw new Error(`Wrong PNG signature. Byte at ${i} should be ${pngSignature[i]}.`);
            }
        }
    }

    // http://www.w3.org/TR/PNG/#5Chunk-layout
    decodeChunk() {
        var length = this.readUint32();
        var type = this.readChars(4);
        var offset = this.offset;
        console.log(type);
        switch (type) {
            case 'IHDR':
                this.decodeIHDR();
                break;
            case 'PLTE':
                throw new Error('Palette image type not supported');
            case 'IDAT':
                this.decodeIDAT(length);
                break;
            case 'tEXt':
                this.decodetEXt(length);
                break;
            case 'IEND':
                this._end = true;
                break;
            default:
                this.skip(length);
                break;
        }
        if (this.offset - offset !== length) {
            throw new Error('Length mismatch while decoding chunk ' + type);
        }
        // TODO compute and validate CRC ?
        // http://www.w3.org/TR/PNG/#5CRC-algorithm
        var crc = this.readUint32();
    }

    // http://www.w3.org/TR/PNG/#11IHDR
    decodeIHDR() {
        var image = this._png;
        image.width = this.readUint32();
        image.height = this.readUint32();
        image.bitDepth = this.readUint8();
        image.colourType = this.readUint8();
        image.compressionMethod = this.readUint8();
        image.filterMethod = this.readUint8();
        image.interlaceMethod = this.readUint8();
        if (this._png.compressionMethod !== 0) {
            throw new Error('Unsupported compression method: ' + image.compressionMethod);
        }
    }

    // http://www.w3.org/TR/PNG/#11IDAT
    decodeIDAT(length) {
        this._inflator.push(this.readBytes(length));
    }

    // http://www.w3.org/TR/PNG/#11tEXt
    decodetEXt(length) {
        var keyword = '';
        var char;
        while ((char = this.readChar()) !== NULL) {
            keyword += char;
        }
        this._png.tEXt[keyword] = this.readChars(length - keyword.length - 1);
    }

    decodeImage() {
        this._inflator.push(empty, true);
        if (this._inflator.err) {
            throw new Error('Error while decompressing the data');
        }
        var data = this._inflator.result;
        this._inflator = null;
        console.log(data.slice(0, 10));
        //this._png.data = data;
    }
}

module.exports = PNGDecoder;
