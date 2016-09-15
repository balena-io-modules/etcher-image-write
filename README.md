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


* [imageWrite](#module_imageWrite)
    * [.write(drive, image, options)](#module_imageWrite.write) ⇒ <code>EventEmitter</code>
    * [.multiwrite(drives, image, options)](#module_imageWrite.multiwrite) ⇒ <code>EventEmitter</code>

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
  fd: fs.openSync('/dev/rdisk2', 'rs+'),
  device: '/dev/rdisk2',
  size: 2014314496
}, {
  stream: fs.createWriteStream('my/image'),
  size: fs.statSync('my/image').size
}, {
  check: true
});

emitter.on('progress', function(state) {
  console.log(state);
});

emitter.on('error', function(error) {
  console.error(error);
});

emitter.on('done', function(results) {
  console.log('Success!');
});
```
<a name="module_imageWrite.multiwrite"></a>

### imageWrite.multiwrite(drives, image, options) ⇒ <code>EventEmitter</code>
**NOTICE:** You might need to run this function as sudo/administrator to
avoid permission issues.

We recommend passing file descriptors opened with `rs+` flags.

The returned event emitter emits the same events as `.write()`, including
a new `finish` event emitter when all drives complete.

You may use the `.drive` property in each of the event arguments
to identify from what device the event comes from.

**Kind**: static method of <code>[imageWrite](#module_imageWrite)</code>  
**Summary**: Write a readable stream to multiple devices in parallel  
**Returns**: <code>EventEmitter</code> - emitter  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| drives | <code>Array.&lt;Object&gt;</code> |  | drives |
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
var emitter = imageWrite.multiwrite([
  {
    fd: fs.openSync('/dev/rdisk2', 'rs+'),
    device: '/dev/rdisk2',
    size: 2014314496
  },
  {
    fd: fs.openSync('/dev/rdisk3', 'rs+'),
    device: '/dev/rdisk3',
    size: 2014314496
  }
], {
  check: true
});

emitter.on('progress', function(state) {
  console.log(`${state.drive} (${state.type}) -> ${Math.floor(state.percentage)}%`);
});

emitter.on('error', function(error) {
  console.error(error);
});

emitter.on('done', function(results) {
  console.log('Success from ${results.drive}!');
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

Run the test suite by doing:

```sh
$ npm test
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
