'use strict';

const PNGDecoder = require('./PNGDecoder');

exports.decode = function decodePNG(data) {
    const decoder = new PNGDecoder(data);
    return decoder.decode();
};
