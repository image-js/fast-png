import IOBuffer from 'iobuffer';
import {deflate} from 'pako';
import {pngSignature, crc} from './common';

export default class PNGDecoder extends IOBuffer {
    constructor(data) {
        super();
        this._checkData(data);
        this.setBigEndian();
    }

    encode() {
        this.encodeSignature();
        this.encodeIHDR();
        this.encodeData();
        this.encodeIEND();
        return this.toArray();
    }

    // https://www.w3.org/TR/PNG/#5PNG-file-signature
    encodeSignature() {
        this.writeBytes(pngSignature);
    }

    // https://www.w3.org/TR/PNG/#11IHDR
    encodeIHDR() {
        this.writeUint32(13);

        this.writeChars('IHDR');

        this.writeUint32(this._png.width);
        this.writeUint32(this._png.height);
        this.writeByte(this._png.bitDepth);
        this.writeByte(this._png.colourType);
        this.writeByte(0); // Compression method
        this.writeByte(0); // Filter method
        this.writeByte(0); // Interlace method

        this.writeCrc(17);
    }

    // https://www.w3.org/TR/PNG/#11IEND
    encodeIEND() {
        this.writeUint32(0);

        this.writeChars('IEND');

        this.writeCrc(4);
    }

    // https://www.w3.org/TR/PNG/#11IDAT
    encodeIDAT(data) {
        this.writeUint32(data.length);

        this.writeChars('IDAT');

        this.writeBytes(data);

        this.writeCrc(data.length + 4);
    }

    encodeData() {
        const {
            width,
            height,
            channels,
            bitDepth,
            data
        } = this._png;
        const slotsPerLine = channels * width;
        const newData = new IOBuffer().setBigEndian();
        var offset = 0;
        for (var i = 0; i < height; i++) {
            newData.writeByte(0); // no filter
            if (bitDepth === 8) {
                offset = writeDataBytes(data, newData, slotsPerLine, offset);
            } else if (bitDepth === 16) {
                offset = writeDataUint16(data, newData, slotsPerLine, offset);
            }
        }
        const buffer = newData.getBuffer();
        const compressed = deflate(buffer);
        this.encodeIDAT(compressed);
    }

    _checkData(data) {
        this._png = {
            width: checkInteger(data.width, 'width'),
            height: checkInteger(data.height, 'height'),
            data: data.data
        };
        const {colourType, channels} = getColourType(data.kind);
        this._png.colourType = colourType;
        this._png.channels = channels;
        this._png.bitDepth = data.bitDepth || 8;
        const expectedSize = this._png.width * this._png.height * channels;
        if (this._png.data.length !== expectedSize) {
            throw new RangeError(`wrong data size. Found ${this._png.data.length}, expected ${expectedSize}`);
        }
    }

    writeCrc(length) {
        this.writeUint32(crc(new Uint8Array(this.buffer, this.byteOffset + this.offset - length, length), length));
    }
}

function checkInteger(value, name) {
    if (Number.isInteger(value) && value > 0) {
        return value;
    }
    throw new TypeError(`${name} must be a positive integer`);
}

function getColourType(kind = 'RGBA') {
    switch (kind) {
        case 'RGBA':
            return {colourType: 6, channels: 4};
        case 'RGB':
            return {colourType: 2, channels: 3};
        case 'GREY':
            return {colourType: 0, channels: 1};
        case 'GREYA':
            return {colourType: 4, channels: 2};
        default:
            throw new Error(`unknown kind: ${kind}`);
    }
}

function writeDataBytes(data, newData, slotsPerLine, offset) {
    for (var j = 0; j < slotsPerLine; j++) {
        newData.writeByte(data[offset++]);
    }
    return offset;
}

function writeDataUint16(data, newData, slotsPerLine, offset) {
    for (var j = 0; j < slotsPerLine; j++) {
        newData.writeUint16(data[offset++]);
    }
    return offset;
}
