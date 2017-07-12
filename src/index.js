import PNGDecoder from './PNGDecoder';
import PNGEncoder from './PNGEncoder';

function decodePNG(data, options = {}) {
    const decoder = new PNGDecoder(data, options);
    return decoder.decode();
}

function encodePNG(png) {
    const encoder = new PNGEncoder(png);
    return encoder.encode();
}

export {
    decodePNG as decode,
    encodePNG as encode
};
