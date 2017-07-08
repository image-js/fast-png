import {join} from 'path';
import {readFileSync} from 'fs';

import {decode} from '../src';

describe('decode', () => {
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
});

function loadAndDecode(img) {
    return decode(readFileSync(join(__dirname, 'img', img)));
}

function check(img, values) {
    for (const prop in values) {
        expect(img[prop]).toBe(values[prop]);
    }
}
