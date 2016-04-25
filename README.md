resin-image-write
-----------------

[![npm version](https://badge.fury.io/js/resin-image-write.svg)](http://badge.fury.io/js/resin-image-write)
[![dependencies](https://david-dm.org/resin-io-modules/resin-image-write.png)](https://david-dm.org/resin-io-modules/resin-image-write.png)
[![Build Status](https://travis-ci.org/resin-io-modules/resin-image-write.svg?branch=master)](https://travis-ci.org/resin-io-modules/resin-image-write)
[![Build status](https://ci.appveyor.com/api/projects/status/qkn859e7gcbo6lb9/branch/master?svg=true)](https://ci.appveyor.com/project/resin-io/resin-image-write/branch/master)

Join our online chat at [![Gitter chat](https://badges.gitter.im/resin-io/chat.png)](https://gitter.im/resin-io/chat)

Write a Resin.io image to a device.

Role
----

The intention of this module is to provide low level access to how a Resin.io image is written to a device.

**THIS MODULE IS LOW LEVEL AND IS NOT MEANT TO BE USED BY END USERS DIRECTLY**.

Installation
------------

Install `resin-image-write` by running:

```sh
$ npm install --save resin-image-write
```

Documentation
-------------

<a name="module_imageWrite.write"></a>

### imageWrite.write(device, stream, options) ⇒ <code>EventEmitter</code>
**NOTICE:** You might need to run this function as sudo/administrator to
avoid permission issues.

The returned EventEmitter instance emits the following events:

- `progress`: A progress event that passes a state object of the form:

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

- `error`: An error event.
- `done`: An event emitted with a boolean success value.

Enabling the `check` option is useful to ensure the image was
successfully written to the device. This is checked by calculating and
comparing checksums from both the original image and the data written
to the device.

**Kind**: static method of <code>[imageWrite](#module_imageWrite)</code>  
**Summary**: Write a readable stream to a device  
**Returns**: <code>EventEmitter</code> - emitter  
**Access:** public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| device | <code>String</code> |  | device |
| stream | <code>ReadStream</code> |  | readable stream |
| options | <code>Object</code> |  | options |
| options.size | <code>Number</code> |  | input stream size |
| [options.check] | <code>Boolean</code> | <code>false</code> | enable write check |

**Example**  
```js
myStream = fs.createReadStream('my/image')

emitter = imageWrite.write '/dev/disk2', myStream,
	check: true
	size: fs.statSync('my/image').size

emitter.on 'progress', (state) ->
	console.log(state)

emitter.on 'error', (error) ->
	console.error(error)

emitter.on 'done', (success) ->
	if success
		console.log('Success!')
	else
		console.log('Failed!')
```

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io-modules/resin-image-write/issues/new) on GitHub and the Resin.io team will be happy to help.

Tests
-----

Run the test suite by doing:

```sh
$ gulp test
```

Contribute
----------

- Issue Tracker: [github.com/resin-io-modules/resin-image-write/issues](https://github.com/resin-io-modules/resin-image-write/issues)
- Source Code: [github.com/resin-io-modules/resin-image-write](https://github.com/resin-io-modules/resin-image-write)

Before submitting a PR, please make sure that you include tests, and that [coffeelint](http://www.coffeelint.org/) runs without any warning:

```sh
$ gulp lint
```

License
-------

The project is licensed under the Apache 2.0 license.
