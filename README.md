etcher-image-write
=================

> The cross-platform way to stream an OS image to a device

[![npm version](https://badge.fury.io/js/etcher-image-write.svg)](http://badge.fury.io/js/etcher-image-write)
[![dependencies](https://david-dm.org/resin-io-modules/etcher-image-write.svg)](https://david-dm.org/resin-io-modules/etcher-image-write.svg)
[![Build Status](https://travis-ci.org/resin-io-modules/etcher-image-write.svg?branch=master)](https://travis-ci.org/resin-io-modules/etcher-image-write)
[![Build status](https://ci.appveyor.com/api/projects/status/nmjinr68wtd9ne2h/branch/master?svg=true)](https://ci.appveyor.com/project/resin-io/etcher-image-write/branch/master)

Installation
------------

Install `etcher-image-write` by running:

```sh
$ npm install --save etcher-image-write
```

Documentation
-------------

<a name="module_imageWrite.write"></a>

### imageWrite.write(drive, image, options) ⇒ <code>EventEmitter</code>
**NOTICE:** You might need to run this function as sudo/administrator to
avoid permission issues.

We recommend passing file descriptors opened with `rs+` flags.

The returned EventEmitter instance emits the following events:

- `progress`: A progress event that passes a state object of the form:

```js
{
  type: 'write' // possible values: 'write', 'check'.
  percentage: 9.05,
  transferred: 949624,
  length: 10485760,
  remaining: 9536136,
  eta: 10,
  runtime: 0,
  delta: 295396,
  speed: 949624
}
```

- `error`: An error event.
- `done`: An event emitted with a boolean success value.

Enabling the `check` option is useful to ensure the image was
successfully written to the device. This is checked by calculating and
comparing checksums from both the original image and the data written
to the device.

The `transform` option is used to handle cases like decompression of
an image on the fly. The stream is piped through this transform stream
*after* the progress stream and *before* any writing and alignment.

This allows the progress to be accurately displayed even when the
client doesn't know the final uncompressed size.

For example, to handle writing a compressed file, you pass the
compressed stream to `.write()`, pass the *compressed stream size*,
and a transform stream to decompress the file.

**Kind**: static method of <code>[imageWrite](#module_imageWrite)</code>  
**Summary**: Write a readable stream to a device  
**Returns**: <code>EventEmitter</code> - emitter  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| drive | <code>Object</code> |  | drive |
| drive.device | <code>String</code> |  | drive device |
| drive.size | <code>Number</code> |  | drive size |
| drive.fd | <code>Number</code> |  | drive file descriptor |
| image | <code>Object</code> |  | image |
| image.stream | <code>ReadStream</code> |  | image readable stream |
| image.size | <code>Number</code> |  | image stream size |
| options | <code>Object</code> |  | options |
| [options.transform] | <code>TransformStream</code> |  | transform stream |
| [options.check] | <code>Boolean</code> | <code>false</code> | enable write check |
| [options.bmap] | <code>String</code> |  | bmap file contents |
| [options.bytesToZeroOutFromTheBeginning] | <code>Number</code> |  | bytes to zero out from the beginning (bmap only) |

**Example**  
```js
var emitter = imageWrite.write({
  fd: fs.openSync('/dev/rdisk2', 'rs+'), // '\\\\.\\PHYSICALDRIVE1' in Windows, for example.
  device: '/dev/rdisk2',
  size: 2014314496
}, {
  stream: fs.createReadStream('my/image'),
  size: fs.statSync('my/image').size
}, {
  check: true
});

emitter.on('progress', (state) => {
  console.log(state);
});

emitter.on('error', (error) => {
  console.error(error);
});

emitter.on('done', (results) => {
  console.log('Success!');
});
```

Errors
------

The errors we emit can be identified by their `code` and `type` properties.

Consult [this
file](https://github.com/resin-io-modules/etcher-image-write/blob/master/lib/errors.js)
for a list of defined errors.

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io-modules/etcher-image-write/issues/new) on GitHub and the Resin.io team will be happy to help.

Tests
-----

To run the full test suite (Node & Electron), you'll need to have Electron installed
either globally or locally in the repository (`npm install [--global] electron`).

Run the test suite by doing:

```sh
$ npm test
```

To run only the Node or Electron tests, respectively:

```sh
$ npm run test-node # OR
$ npm run test-electron
```

Contribute
----------

- Issue Tracker: [github.com/resin-io-modules/etcher-image-write/issues](https://github.com/resin-io-modules/etcher-image-write/issues)
- Source Code: [github.com/resin-io-modules/etcher-image-write](https://github.com/resin-io-modules/etcher-image-write)

Before submitting a PR, please make sure that you include tests, and that [jshint](http://jshint.com) runs without any warning:

```sh
$ npm run lint
```

License
-------

`etcher-image-write` is free software, and may be redistributed under the terms specified in the [license](https://github.com/resin-io-modules/etcher-image-write/blob/master/LICENSE).
