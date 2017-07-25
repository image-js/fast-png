import IOBuffer from 'iobuffer';
import {deflate} from 'pako';
import {pngSignature, crc} from './common';

const defaultZlibOptions = {
    level: 3
};

export default class PNGEncoder extends IOBuffer {
    constructor(data, options) {
        super();
        this._checkData(data);
        this._zlibOptions = Object.assign({}, defaultZlibOptions, options.zlib);
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
            /* istanbul ignore else */
            if (bitDepth === 8) {
                offset = writeDataBytes(data, newData, slotsPerLine, offset);
            } else if (bitDepth === 16) {
                offset = writeDataUint16(data, newData, slotsPerLine, offset);
            } else {
                throw new Error('unreachable');
            }
        }
        const buffer = newData.getBuffer();
        const compressed = deflate(buffer, this._zlibOptions);
        this.encodeIDAT(compressed);
    }

    _checkData(data) {
        this._png = {
            width: checkInteger(data.width, 'width'),
            height: checkInteger(data.height, 'height'),
            data: data.data
        };
        const {colourType, channels, bitDepth} = getColourType(data);
        this._png.colourType = colourType;
        this._png.channels = channels;
        this._png.bitDepth = bitDepth;
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

function getColourType(data) {
    const {
        components = 3,
        alpha = true,
        bitDepth = 8
    } = data;
    if (components !== 3 && components !== 1) {
        throw new RangeError(`unsupported number of components: ${components}`);
    }
    if (bitDepth !== 8 && bitDepth !== 16) {
        throw new RangeError(`unsupported bit depth: ${bitDepth}`);
    }
    const channels = components + Number(alpha);
    const returnValue = {channels, bitDepth};
    switch (channels) {
        case 4:
            returnValue.colourType = 6;
            break;
        case 3:
            returnValue.colourType = 2;
            break;
        case 1:
            returnValue.colourType = 0;
            break;
        case 2:
            returnValue.colourType = 4;
            break;
        default:
            throw new Error(`unsupported number of channels: ${channels}`);
    }
    return returnValue;
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
