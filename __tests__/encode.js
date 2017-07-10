import {PNG} from 'pngjs';

import {encode, decode} from '../src';

describe('encode', () => {
    it('simple RGBA', () => {
        const dataArray = new Uint8Array([255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255]);
        const data = encode({
            width: 2,
            height: 2,
            data: dataArray
        });
        expect(data).toBeInstanceOf(Uint8Array);
        const decoded = decode(data);
        const expected = {
            width: 2,
            height: 2,
            bitDepth: 8,
            colourType: 6
        };
        check(decoded, expected);
        checkPngJs(data, expected);
        expect(decoded.data).toEqual(dataArray);
    });

    it('simple GREY', () => {
        const dataArray = new Uint8Array([0, 32, 64, 96, 127, 255]);
        const data = encode({
            width: 2,
            height: 3,
            data: dataArray,
            kind: 'GREY'
        });
        expect(data).toBeInstanceOf(Uint8Array);
        const decoded = decode(data);
        const expected = {
            width: 2,
            height: 3,
            bitDepth: 8,
            colourType: 0
        };
        check(decoded, expected);
        checkPngJs(data, expected);
        expect(decoded.data).toEqual(dataArray);
    });

    it('RGB 16-bit', () => {
        const dataArray = new Uint16Array([65535, 65535, 65535, 0, 0, 0, 32768, 32768, 32768, 500, 500, 500]);
        const data = encode({
            width: 2,
            height: 2,
            bitDepth: 16,
            data: dataArray,
            kind: 'RGB'
        });
        expect(data).toBeInstanceOf(Uint8Array);
        const decoded = decode(data);
        const expected = {
            width: 2,
            height: 2,
            bitDepth: 16,
            colourType: 2
        };
        check(decoded, expected);
        checkPngJs(data, expected);
        expect(decoded.data).toEqual(dataArray);
    });
});

function check(img, values) {
    for (const prop in values) {
        expect(img[prop]).toBe(values[prop]);
    }
}

function checkPngJs(data, values) {
    const img = PNG.sync.read(Buffer.from(data, data.byteOffset, data.length));
    var newValues = Object.assign({}, values);
    if (newValues.bitDepth !== undefined) {
        newValues.depth = newValues.bitDepth;
        delete newValues.bitDepth;
    }
    if (newValues.colourType !== undefined) {
        newValues.colorType = newValues.colourType;
        delete newValues.colourType;
    }
    check(img, newValues);
}
