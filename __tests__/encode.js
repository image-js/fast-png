import {encode} from '../src';

describe('encode', () => {
    it('simple', () => {
        const data = encode({});
        console.log(data);
    });
});
