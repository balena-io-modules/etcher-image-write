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

const Bluebird = require('bluebird');
const _ = require('lodash');
const fs = require('fs');
const bmapflash = require('bmapflash');
const CRC32Stream = require('crc32-stream');
const streamChunker = require('stream-chunker');
const progressStream = require('progress-stream');
const PassThroughStream = require('stream').PassThrough;
const through2 = require('through2');
const utils = require('./utils');

/**
 * @summary Write an image using bmap
 * @function
 * @public
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {Number} options.imageSize - image size
 * @param {ReadableStream} options.imageStream - image stream
 * @param {String} options.bmapContents - bmap xml contents
 * @param {Number} [options.bytesToZeroOutFromTheBeginning] - bytes to zero out from the beginning
 * @param {Function} options.progress - progress callback (state)
 * @fulfil {Object} - results
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * write.usingBmap(fd, {
 *   imageStream: fs.createReadStream('path/to/image'),
 *   imageSize: 65536 * 128,
 *   bmapContents: fs.readFileSync('path/to/image.bmap', {
 *     encoding: 'utf8'
 *   }),
 *   progress: (state) => {
 *     console.log(state);
 *   }
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.usingBmap = (deviceFileDescriptor, options = {}) => {
  return new Bluebird(function(resolve, reject) {
    const flasher = bmapflash.flashImageToFileDescriptor(
      options.imageStream,
      deviceFileDescriptor,
      options.bmapContents,
      {
        bytesToZeroOutFromTheBeginning: options.bytesToZeroOutFromTheBeginning
      }
    );

    flasher.on('progress', options.progress);
    flasher.on('error', reject);
    flasher.on('done', () => {
      return resolve({
        transferredBytes: options.imageSize
      });
    });
  });
};

/**
 * @summary Write an image by streaming to the drive
 * @function
 * @public
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {ReadableStream} options.imageStream - image stream
 * @param {TransformStream} [options.transformStream] - transform stream
 * @param {Number} options.imageSize - image size
 * @param {Number} options.chunkSize - chunk size
 * @param {Number} options.driveSize - drive size
 * @param {Function} options.progress - progress callback (state)
 * @fulfil {Object} - results
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * write.usingStreaming(fd, {
 *   imageStream: fs.createReadStream('path/to/image'),
 *   imageSize: 65536 * 128,
 *   chunkSize: 65536,
 *   driveSize: 65536 * 256,
 *   progress: (state) => {
 *     console.log(state);
 *   }
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.usingStreaming = (deviceFileDescriptor, options = {}) => {
  return new Bluebird(function(resolve, reject) {
    var checksumStream = new CRC32Stream();
    var transferredBytes = 0;
    var paddingBytes = 0;

    return utils.safePipe([
      {
        stream: options.imageStream
      },
      {
        stream: progressStream({
          length: _.parseInt(options.imageSize),
          time: 500
        }),
        events: {
          progress: options.progress
        }
      },
      {
        stream: options.transformStream || new PassThroughStream()
      },
      {
        stream: checksumStream
      },
      {
        stream: streamChunker(options.chunkSize, {
          flush: true,
          align: false
        })
      },
      {
        stream: through2(function(chunk, encoding, callback) {
          transferredBytes += chunk.length;

          if (chunk.length < options.chunkSize) {
            paddingBytes += options.chunkSize - chunk.length;
            chunk = utils.padChunk(chunk, options.chunkSize);
          }

          if (transferredBytes + paddingBytes > options.driveSize) {
            var error = new Error('Not enough space on the drive');
            error.code = 'ENOSPC';
            return callback(error);
          }

          return callback(null, chunk);
        })
      },
      {
        stream: fs.createWriteStream(null, {
          fd: deviceFileDescriptor,
          autoClose: false
        }),
        events: {
          finish: function() {
            return resolve({
              transferredBytes: transferredBytes,
              checksum: checksumStream.hex().toLowerCase()
            });
          }
        }
      }
    ], reject);
  });
};

/**
 * @summary Infer writing strategy from options
 * @function
 * @public
 *
 * @description
 * This is a facade for the other `.using*()` functions
 * implemented on this file.
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @fulfil {Object} - results
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * write.inferFromOptions(fd, { ... }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.inferFromOptions = (deviceFileDescriptor, options = {}) => {
  if (options.bmapContents) {
    return exports.usingBmap(deviceFileDescriptor, {
      imageStream: options.imageStream,
      imageSize: options.imageSize,
      bmapContents: options.bmapContents,
      bytesToZeroOutFromTheBeginning: options.bytesToZeroOutFromTheBeginning,
      progress: options.progress
    });
  }

  return exports.usingStreaming(deviceFileDescriptor, {
    imageStream: options.imageStream,
    imageSize: options.imageSize,
    transformStream: options.transformStream,
    chunkSize: options.chunkSize,
    driveSize: options.driveSize,
    progress: options.progress
  });
};
