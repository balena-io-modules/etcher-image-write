
/*
The MIT License

Copyright (c) 2015 Resin.io, Inc. https://resin.io.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

/**
 * @module imageWrite
 */
var EventEmitter, Promise, diskio, progressStream, _;

EventEmitter = require('events').EventEmitter;

_ = require('lodash');

Promise = require('bluebird');

diskio = Promise.promisifyAll(require('diskio'));

progressStream = require('progress-stream');


/**
 * @summary Write a readable stream to a device
 * @function
 * @public
 *
 * @description
 *
 * **NOTICE:** You might need to run this function as sudo/administrator to avoid permission issues.
 *
 * The returned EventEmitter instance emits the following events:
 *
 * - `progress`: A progress event that passes a state object of the form:
 *
 *		{
 *			percentage: 9.05,
 *			transferred: 949624,
 *			length: 10485760,
 *			remaining: 9536136,
 *			eta: 10,
 *			runtime: 0,
 *			delta: 295396,
 *			speed: 949624
 *		}
 *
 * - `error`: An error event.
 * - `done`: An event emitted when the readable stream was written completely.
 *
 * This function is smart enough to auto read the length of the readable stream if it was created by [resin-request](https://github.com/resin-io/resin-request).
 *
 * If you're passing a readable stream from a custom location, you can configure the length by adding a `.length` number property to the stream.
 *
 * Lacking length information on the stream results on incomplete progress state information.
 *
 * @param {String} device - device
 * @param {ReadStream} stream - readable stream
 * @returns {EventEmitter} emitter
 *
 * @example
 * emitter = imageWrite.write('/dev/disk2', myStream)
 *
 * emitter.on 'progress', (state) ->
 * 	console.log(state)
 *
 * emitter.on 'error', (error) ->
 * 	console.error(error)
 *
 * emitter.on 'done', ->
 * 	console.log('Finished writing to device')
 */

exports.write = function(device, stream) {
  var emitter, progress, size, _ref, _ref1;
  emitter = new EventEmitter();
  size = stream.length || ((_ref = stream.responseContent) != null ? (_ref1 = _ref.headers) != null ? _ref1['content-length'] : void 0 : void 0);
  progress = progressStream({
    length: _.parseInt(size),
    time: 500
  });
  progress.on('progress', function(state) {
    return emitter.emit('progress', state);
  });
  stream.pipe(progress);
  diskio.writeStreamAsync(device, progress).then(function() {
    return emitter.emit('done');
  })["catch"](function(error) {
    return emitter.emit('error', error);
  });
  return emitter;
};
