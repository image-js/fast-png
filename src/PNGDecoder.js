'use strict';

const InputBuffer = require('iobuffer').InputBuffer;

class PNGDecoder extends InputBuffer {
    constructor(data) {
        super(data);
        this._decoded = false;
        this._png = null;
    }

    decode() {
        if (this._decoded) return this._png;
        // TODO decode
        return this._png;
    }
}

module.exports = PNGDecoder;
