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

var Bluebird = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var PassThroughStream = require('stream').PassThrough;
var write = require('./write');
var _ = require('lodash');
var utils = require('./utils');
var validate = require('./validate');

const performFlash = (drive, image, options) => {
  const emitter = new EventEmitter();

  write.inferFromOptions(drive.fd, {
    imageSize: image.size,
    imageStream: image.stream,
    transformStream: options.transform,
    bmapContents: options.bmap,
    bytesToZeroOutFromTheBeginning: options.bytesToZeroOutFromTheBeginning,
    chunkSize: 65536 * 16, // 64K * 16 = 1024K = 1M
    driveSize: drive.size,
    progress: (state) => {
      state.type = 'write';
      state.drive = drive.device;
      emitter.emit('progress', state);
    }
  }).then((results) => {
    return validate.inferFromOptions(drive.fd, {
      omitValidation: !options.check,
      bmapContents: options.bmap,
      imageSize: image.size,
      imageChecksum: results.checksum,
      progress: (state) => {
        state.type = 'check';
        state.drive = drive.device;
        emitter.emit('progress', state);
      }
    }).then((validationResults) => {
      validationResults.drive = drive.device;
      emitter.emit('done', validationResults);
    });
  }).catch((error) => {
    error.drive = drive.device;
    emitter.emit('error', error);
  });

  return emitter;
};

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
 *   fd: fs.openSync('/dev/rdisk2', 'rs+'),
 *   device: '/dev/rdisk2',
 *   size: 2014314496
 * }, {
 *   stream: fs.createWriteStream('my/image'),
 *   size: fs.statSync('my/image').size
 * }, {
 *   check: true
 * });
 *
 * emitter.on('progress', function(state) {
 *   console.log(state);
 * });
 *
 * emitter.on('error', function(error) {
 *   console.error(error);
 * });
 *
 * emitter.on('done', function(results) {
 *   console.log('Success!');
 * });
 */
exports.write = function(drive, image, options) {
  options = options || {};

  var emitter = new EventEmitter();

  if (!image.size || !_.isNumber(image.size)) {
    throw new Error('Invalid image size: ' + image.size);
  }

  if (!drive.size || !_.isNumber(drive.size)) {
    throw new Error('Invalid drive size: ' + drive.size);
  }

  utils.prepareDrives([ drive.device ]).then(utils.rescanDrives).then(() => {
    return new Bluebird((resolve, reject) => {
      const writer = performFlash(drive, image, options);
      utils.redirectEvent(writer, emitter, 'progress');
      writer.on('error', reject);
      writer.on('done', resolve);
    });
  }).tap(utils.rescanDrives).then((validationResults) => {
    emitter.emit('done', validationResults);
  }).catch((error) => {
    emitter.emit('error', error);
  });

  return emitter;
};

/**
 * @summary Write a readable stream to multiple devices in parallel
 * @function
 * @public
 *
 * @description
 * **NOTICE:** You might need to run this function as sudo/administrator to
 * avoid permission issues.
 *
 * We recommend passing file descriptors opened with `rs+` flags.
 *
 * The returned event emitter emits the same events as `.write()`, including
 * a new `finish` event emitter when all drives complete.
 *
 * You may use the `.drive` property in each of the event arguments
 * to identify from what device the event comes from.
 *
 * @param {Object[]} drives - drives
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
 * var emitter = imageWrite.multiwrite([
 *   {
 *     fd: fs.openSync('/dev/rdisk2', 'rs+'),
 *     device: '/dev/rdisk2',
 *     size: 2014314496
 *   },
 *   {
 *     fd: fs.openSync('/dev/rdisk3', 'rs+'),
 *     device: '/dev/rdisk3',
 *     size: 2014314496
 *   }
 * ], {
 *   check: true
 * });
 *
 * emitter.on('progress', function(state) {
 *   console.log(`${state.drive} (${state.type}) -> ${Math.floor(state.percentage)}%`);
 * });
 *
 * emitter.on('error', function(error) {
 *   console.error(error);
 * });
 *
 * emitter.on('done', function(results) {
 *   console.log('Success from ${results.drive}!');
 * });
 */
exports.multiwrite = (drives, image, options = {}) => {
  const emitter = new EventEmitter();

  utils.prepareDrives([ drive.device ]).then(utils.rescanDrives).then(() => {

    // For some reason, piping the same fs.ReadStream
    // to multiple streams at the same time causes
    // no data to be piped at all.
    // As a workaround, we first pipe the fs.ReadStream
    // to a PassThrough stream, which can then be piped
    // to many places without problems.
    const passStream = new PassThroughStream();
    image.stream.pipe(passStream);
    utils.redirectEvent(passStream, emitter, 'error');

    // We have to pipe the image stream to all the
    // destination streams before starting any writes,
    // because some of them might get data a bit after
    // the first write starts consuming data, and
    // therefore might end up missing some stuff.
    const imageStreams = _.map(drives, () => {
      const imageStream = new PassThroughStream();
      utils.redirectEvent(imageStream, emitter, 'error');
      passStream.pipe(imageStream);
      return imageStream;
    });

    let flashedDrives = 0;

    _.each(drives, (drive, index) => {
      const driveEmitter = performFlash(drive, {
        size: image.size,
        stream: _.nth(imageStreams, index)
      }, options);

      utils.redirectEvent(driveEmitter, emitter, 'progress');
      utils.redirectEvent(driveEmitter, emitter, 'error');

      driveEmitter.on('done', (validationResults) => {
        flashedDrives += 1;
        emitter.emit('done', validationResults);

        if (flashedDrives === drives.length) {
          utils.rescanDrives().then(() => {
            emitter.emit('finish');
          }).catch((error) => {
            emitter.emit('error', error);
          });
        }
      });
    });

  }).catch((error) => {
    emitter.emit('error', error);
  });

  return emitter;
};
