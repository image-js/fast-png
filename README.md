# fast-png

PNG image decoder and encoder written entirely in JavaScript.

<h3 align="center">

  <a href="https://www.zakodium.com">
    <img src="https://www.zakodium.com/brand/zakodium-logo-white.svg" width="50" alt="Zakodium logo" />
  </a>

  <p>
    Maintained by <a href="https://www.zakodium.com">Zakodium</a>
  </p>

[![NPM version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
[![npm download][download-image]][download-url]

</h3>

## Installation

`$ npm install --save fast-png`

## Usage

### `decode(png[, options])`

#### Arguments

- `png` - A TypedArray or Buffer that contains the PNG data.
- `options` - An object of options

#### Options

- `checkCrc` - If set to `true`, the CRC will be checked for each chunk and an error will be thrown in case it's wrong (default: false).

### `encode(image)`

#### Arguments

- `png` - An object representing the image. You can pass an ImageData from the Canvas API or an object with the following properties:
  - `width` - The width of the image
  - `height` - The height of the image
  - `data` - An array or TypedArray with the image data
  - `depth` - A number indicating the color depth (only 8 and 16 are supported now). Default: `8`.
  - `channels` - Number of channels, including alpha (1, 2, 3 and 4 are supported). Default: `4`.
  - `text` - An object with key-value pairs representing `tEXt` chunks. The keys must have less than 80 characters.
             The keys and values must have only characters in the latin1 charset (maximum code point of 255).
             Default: `undefined`.

### `hasPngSignature(array)`

Returns whether the array starts with the PNG signature (magic bytes).

## PNG standard

Spec can be found at: https://www.w3.org/TR/PNG/

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/fast-png.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/fast-png
[ci-image]: https://github.com/image-js/fast-png/workflows/Node.js%20CI/badge.svg?branch=main
[ci-url]: https://github.com/image-js/fast-png/actions?query=workflow%3A%22Node.js+CI%22
[download-image]: https://img.shields.io/npm/dm/fast-png.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/fast-png
