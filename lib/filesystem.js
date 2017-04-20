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

const fs = require('fs');
const _ = require('lodash');
const os = require('os');
const errors = require('./errors');

// The functions to perform common I/O operations defined in this file
// contains certain workarounds to compensate SDCard errors and similar
// problems, therefore every I/O operation from this module should use
// the filesystem functions exposed in this file.

/**
 * @summary Maximum I/O retries
 * @constant
 * @type {Number}
 */
const MAXIMUM_RETRIES = 10;

/**
 * @summary I/O retry base timeout, in milliseconds
 * @constant
 * @type {Number}
 */
const RETRY_BASE_TIMEOUT = 100;

/**
 * @summary Handle read/write errors
 * @function
 * @private
 *
 * @param {Error} error - error
 * @param {Object} options - options
 * @param {Number} options.currentRetries - current number of retries
 * @param {Function} options.retry - retry function (currentRetries)
 * @param {Function} callback - callback (error)
 * @returns {Undefined}
 *
 * @example
 * const foo = (callback, retries = 1) => {
 *   bar((error) => {
 *     if (error) {
 *       handleError(error, {
 *         currentRetries: retries,
 *         retry: (currentRetries) => {
 *           foo(callback, currentRetries + 1);
 *         }
 *       }, callback);
 *     }
 *
 *     callback(null, 'Success!');
 *   });
 * };
 */
const handleError = (error, options, callback) => {
  const platform = os.platform();

  if (_.some([
    platform === 'darwin' && (error.code === 'ENXIO' || error.code === 'EBUSY'),
    platform === 'win32' && (error.code === 'ENOENT' || error.code === 'UNKNOWN')
  ])) {
    return callback(errors.unpluggedError());
  }

  // In some faulty SDCards or SDCard readers you might randomly
  // get EIO errors, but they usually go away after some retries.
  if (error.code === 'EIO') {
    if (options.currentRetries > MAXIMUM_RETRIES) {
      if (platform === 'linux') {
        return callback(errors.unpluggedError());
      }

      return callback(error);
    }

    return setTimeout(() => {
      options.retry(options.currentRetries);
    }, RETRY_BASE_TIMEOUT * options.currentRetries);
  }

  callback(error);
};

/**
 * @summary Write a chunk to a file descriptor
 * @function
 * @public
 *
 * @description
 * This function is simply a convenient wrapper around `fs.write()`.
 *
 * @param {Number} fd - file descriptor
 * @param {Buffer} chunk - buffer chunk
 * @param {Number} position - file position to write to
 * @param {Function} callback - callback (error)
 * @param {Number} [retries=1] - number of pending retries
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 *
 * filesystem.writeChunk(fd, Buffer.allocUnsafe(65536), 0, (error) => {
 *   if (error) {
 *     throw error;
 *   }
 *
 *   console.log('We wrote a 65536 bytes chunk at position 0');
 * });
 */
exports.writeChunk = (fd, chunk, position, callback, retries) => {
  retries = retries || 1;

  fs.write(fd, chunk, 0, chunk.length, position, (error, bytesWritten) => {
    if (error) {
      return handleError(error, {
        currentRetries: retries,
        retry: (currentRetries) => {
          return exports.writeChunk(fd, chunk, position, callback, currentRetries + 1);
        }
      }, callback);
    }

    if (bytesWritten !== chunk.length) {
      return callback(new Error(`Write ${bytesWritten} bytes, ${chunk.length} expected`));
    }

    return callback();
  });
};

/**
 * @summary Read a chunk from a file descriptor
 * @function
 * @public
 *
 * @description
 * This function is simply a convenient wrapper around `fs.read()`.
 *
 * @param {Number} fd - file descriptor
 * @param {Number} size - chunk size to read
 * @param {Number} position - position to read from
 * @param {Function} callback - callback (error, buffer)
 * @param {Number} [retries=1] - number of pending retries
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 *
 * filesystem.readChunk(fd, 512, 0, (error, buffer) => {
 *   if (error) {
 *     throw error;
 *   }
 *
 *   console.log(buffer);
 * });
 */
exports.readChunk = (fd, size, position, callback, retries) => {
  retries = retries || 1;

  fs.read(fd, Buffer.allocUnsafe(size), 0, size, position, (error, bytesRead, buffer) => {
    if (error) {
      return handleError(error, {
        currentRetries: retries,
        retry: (currentRetries) => {
          return exports.readChunk(fd, size, position, callback, currentRetries + 1);
        }
      }, callback);
    }

    if (bytesRead === 0) {
      return callback(null, null);
    }

    return callback(null, buffer);
  });
};
