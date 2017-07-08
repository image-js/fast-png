import IOBuffer from 'iobuffer';
import {pngSignature} from './common';

export default class PNGDecoder extends IOBuffer {
    constructor(data, options) {
        super();
        this._png = data;
        this._options = options;
        this.setBigEndian();
    }

    encode() {
        if (this._decoded) return this._png;
        this._png = {
            tEXt: {}
        };
        this.encodeSignature();
        return this.getBuffer();
    }

    // https://www.w3.org/TR/PNG/#5PNG-file-signature
    encodeSignature() {
        this.writeBytes(pngSignature);
    }
}
