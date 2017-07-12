import {join} from 'path';
import {readFileSync} from 'fs';

import {decode} from '../src';

describe('decode', () => {
    it('BW2x2', () => {
        const img = loadAndDecode('BW2x2.png');
        check(img, {
            width: 2,
            height: 2,
            bitDepth: 8,
            colourType: 4
        });
        expect(img.data).toBeInstanceOf(Uint8Array);
        expect(img.data).toEqual(new Uint8Array([0, 255, 255, 255, 255, 255, 0, 255]));
    });

    it('ColorGrid5x5', () => {
        const img = loadAndDecode('ColorGrid5x5.png');
        check(img, {
            width: 10,
            height: 10,
            bitDepth: 8,
            colourType: 6
        });
        expect(img.data).toBeInstanceOf(Uint8Array);
        expect(img.data.length).toBe(10 * 10 * 4);
    });

    it('palette', () => {
        const img = loadAndDecode('palette.png');
        check(img, {
            width: 150,
            height: 200,
            bitDepth: 8,
            colourType: 3
        });
        expect(img.palette).toBeInstanceOf(Array);
        expect(img.palette.length).toBe(256);
        expect(img.palette[0]).toEqual([124, 124, 124]);
    });

    it('should not throw when CRC is correct', () => {
        loadAndDecode('palette.png', {checkCrc: true});
    });
});

function loadAndDecode(img, options) {
    return decode(readFileSync(join(__dirname, 'img', img)), options);
}

function check(img, values) {
    for (const prop in values) {
        expect(img[prop]).toBe(values[prop]);
    }
}
