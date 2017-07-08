import PNGDecoder from './PNGDecoder';
import PNGEncoder from './PNGEncoder';

function decodePNG(data) {
    const decoder = new PNGDecoder(data);
    return decoder.decode();
}

function encodePNG(png, options = {}) {
    const encoder = new PNGEncoder(png, options);
    return encoder.encode();
}

export {
    decodePNG as decode,
    encodePNG as encode
};
