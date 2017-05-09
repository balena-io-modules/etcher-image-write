/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * @module imageWrite
 */

const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const win32 = require('./win32');
const validate = require('./validate');
const write = require('./write');

/**
 * @summary Write a readable stream to a device
 * @function
 * @public
 *
 * @description
 *
 * **NOTICE:** You might need to run this function as sudo/administrator to
 * avoid permission issues.
 *
 * We recommend passing file descriptors opened with `rs+` flags.
 *
 * The returned EventEmitter instance emits the following events:
 *
 * - `progress`: A progress event that passes a state object of the form:
 *
 * ```js
 * {
 *   type: 'write' // possible values: 'write', 'check'.
 *   percentage: 9.05,
 *   transferred: 949624,
 *   length: 10485760,
 *   remaining: 9536136,
 *   eta: 10,
 *   runtime: 0,
 *   delta: 295396,
 *   speed: 949624
 * }
 * ```
 *
 * - `error`: An error event.
 * - `done`: An event emitted with a boolean success value.
 *
 * Enabling the `check` option is useful to ensure the image was
 * successfully written to the device. This is checked by calculating and
 * comparing checksums from both the original image and the data written
 * to the device.
 *
 * The `transform` option is used to handle cases like decompression of
 * an image on the fly. The stream is piped through this transform stream
 * *after* the progress stream and *before* any writing and alignment.
 *
 * This allows the progress to be accurately displayed even when the
 * client doesn't know the final uncompressed size.
 *
 * For example, to handle writing a compressed file, you pass the
 * compressed stream to `.write()`, pass the *compressed stream size*,
 * and a transform stream to decompress the file.
 *
 * @param {Object} drive - drive
 * @param {String} drive.device - drive device
 * @param {Number} drive.size - drive size
 * @param {Number} drive.fd - drive file descriptor
 * @param {Object} image - image
 * @param {ReadStream} image.stream - image readable stream
 * @param {Number} image.size - image stream size
 * @param {Object} options - options
 * @param {TransformStream} [options.transform] - transform stream
 * @param {Boolean} [options.check=false] - enable write check
 * @param {String} [options.bmap] - bmap file contents
 * @param {Number} [options.bytesToZeroOutFromTheBeginning] - bytes to zero out from the beginning (bmap only)
 * @returns {EventEmitter} emitter
 *
 * @example
 * var emitter = imageWrite.write({
 *   fd: fs.openSync('/dev/rdisk2', 'rs+'), // '\\\\.\\PHYSICALDRIVE1' in Windows, for example.
 *   device: '/dev/rdisk2',
 *   size: 2014314496
 * }, {
 *   stream: fs.createReadStream('my/image'),
 *   size: fs.statSync('my/image').size
 * }, {
 *   check: true
 * });
 *
 * emitter.on('progress', (state) => {
 *   console.log(state);
 * });
 *
 * emitter.on('error', (error) => {
 *   console.error(error);
 * });
 *
 * emitter.on('done', (results) => {
 *   console.log('Success!');
 * });
 */
exports.write = (drive, image, options) => {
  options = options || {};

  const emitter = new EventEmitter();

  if (!image.size || !_.isNumber(image.size)) {
    throw new Error('Invalid image size: ' + image.size);
  }

  if (!drive.size || !_.isNumber(drive.size)) {
    throw new Error('Invalid drive size: ' + drive.size);
  }

  // 64K * 16 = 1024K = 1M
  const CHUNK_SIZE = 65536 * 16;

  win32.prepare(drive.device).then(function() {
    return write.inferFromOptions(drive.fd, {
      imageSize: image.size,
      imageStream: image.stream,
      transformStream: options.transform,
      bmapContents: options.bmap,
      bytesToZeroOutFromTheBeginning: options.bytesToZeroOutFromTheBeginning,
      chunkSize: CHUNK_SIZE,

      // The minimum physical block size
      minimumChunkSize: 512,

      driveSize: drive.size,
      progress: (state) => {
        state.type = 'write';
        state.eta = _.isNumber(state.eta) ? state.eta : -1;
        emitter.emit('progress', state);
      }
    });
  }).then((results) => {
    return validate.inferFromOptions(drive.fd, {
      omitValidation: !options.check,
      bmapContents: options.bmap,
      imageSize: results.transferredBytes,
      imageChecksum: results.checksum,
      chunkSize: CHUNK_SIZE,
      progress: (state) => {
        state.type = 'check';
        state.eta = _.isNumber(state.eta) ? state.eta : -1;
        emitter.emit('progress', state);
      }
    }).tap(win32.rescan).then((validationResults) => {
      emitter.emit('done', validationResults);
    });
  }).catch((error) => {
    emitter.emit('error', error);
  });

  return emitter;
};
