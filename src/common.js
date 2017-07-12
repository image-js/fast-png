export const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

const crcTable = [];
for (let n = 0; n < 256; n++) {
    var c = n;
    for (let k = 0; k < 8; k++) {
        if (c & 1) {
            c = 0xedb88320 ^ (c >>> 1);
        } else {
            c = c >>> 1;
        }
    }
    crcTable[n] = c;
}

const initialCrc = 0xffffffff;
function updateCrc(crc, data, length) {
    var c = crc;
    for (var n = 0; n < length; n++) {
        c = crcTable[(c ^ data[n]) & 0xff] ^ (c >>> 8);
    }
    return c;
}

export function crc(data, length) {
    return (updateCrc(initialCrc, data, length) ^ initialCrc) >>> 0;
}
