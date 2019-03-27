# fast-png

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

PNG image decoder and encoder written entirely in JavaScript.

## Installation

`$ npm install --save fast-png`

## Usage

### `decode(png[, options])`

**Arguments**

- `png` - A TypedArray or Buffer that contains the PNG data.
- `options` - An object of options

**Options**

- `checkCrc` - If set to `true`, the CRC will be checked for each chunk and an error will be thrown in case it's wrong (default: false).

### `encode(image)`

**Arguments**

- `png` - An object representing the image. You can pass an ImageData from the Canvas API or an object with the following properties:
  - `width` - The width of the image
  - `height` - The height of the image
  - `data` - An array or TypedArray with the image data
  - `bitDepth` - A number indicating the bit depth (only 8 and 16 are supported now). Defaults to 8.
  - `components` - Number of non-alpha channels (1 or 3 are supported). Defaults to 3.
  - `alpha` - Boolean indicating if an alpha channel is present. Defaults to true.

## PNG standard

Spec can be found at: https://www.w3.org/TR/PNG/

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/fast-png.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/fast-png
[travis-image]: https://img.shields.io/travis/image-js/fast-png/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/image-js/fast-png
[codecov-image]: https://img.shields.io/codecov/c/github/image-js/fast-png.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/image-js/fast-png
[download-image]: https://img.shields.io/npm/dm/fast-png.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/fast-png
