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
const bmapflash = require('bmapflash');
const _ = require('lodash');
const checksum = require('./checksum');
const errors = require('./errors');

/**
 * @summary Validate an image using bmap
 * @function
 * @public
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {String} options.bmapContents - bmap xml contents
 * @param {Function} options.progress - progress callback (state)
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * validate.usingBmap(fd, {
 *   imageStream: fs.createReadStream('path/to/image'),
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
exports.usingBmap = (deviceFileDescriptor, options) => {
  return new Bluebird((resolve, reject) => {
    const validator = bmapflash.validateFlashedImage(deviceFileDescriptor, options.bmapContents);
    validator.on('progress', options.progress);
    validator.on('error', reject);
    validator.on('done', resolve);
  }).then((invalidRanges) => {
    if (!_.isEmpty(invalidRanges)) {
      throw errors.validationError();
    }

    return {};
  });
};

/**
 * @summary Validate an image using a checksum
 * @function
 * @public
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {Number} options.imageSize - image size
 * @param {String} options.imageChecksum - image checksum
 * @param {Number} options.chunkSize - chunk size
 * @param {Function} options.progress - progress callback (state)
 * @fulfil {Object} - results
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * validate.usingChecksum(fd, {
 *   imageSize: 65536 * 128,
 *   imageChecksum: '717a34c1',
 *   chunkSize: 65536 * 16,
 *   progress: (state) => {
 *     console.log(state);
 *   }
 * }).then((results) => {
 *   console.log(results.sourceChecksum);
 * });
 */
exports.usingChecksum = (deviceFileDescriptor, options) => {
  return checksum.calculateDeviceChecksum(deviceFileDescriptor, {
    imageSize: options.imageSize,
    progress: options.progress,
    chunkSize: options.chunkSize
  }).then((deviceChecksum) => {
    if (options.imageChecksum !== deviceChecksum) {
      throw errors.validationError();
    }

    return {
      sourceChecksum: options.imageChecksum
    };
  });
};

/**
 * @summary Mock validation
 * @function
 * @public
 *
 * @description
 * This function is a dummy routine validation that
 * always reports that validation succeeded.
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {String} options.imageChecksum - image checksum
 * @fulfil {Object} - results
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * validate.mock(fd, {
 *   imageChecksum: '717a34c1',
 * }).then((results) => {
 *   console.log(results.sourceChecksum);
 * });
 */
exports.mock = (deviceFileDescriptor, options) => {
  return Bluebird.resolve({
    sourceChecksum: options.imageChecksum
  });
};

/**
 * @summary Infer validation strategy from options
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
 * validate.inferFromOptions(fd, { ... }).then((results) => {
 *   console.log(results);
 * });
 */
exports.inferFromOptions = (deviceFileDescriptor, options) => {
  if (options.omitValidation) {
    return exports.mock(deviceFileDescriptor, {
      imageChecksum: options.imageChecksum
    });
  }

  if (options.bmapContents) {
    return exports.usingBmap(deviceFileDescriptor, {
      bmapContents: options.bmapContents,
      progress: options.progress
    });
  }

  return exports.usingChecksum(deviceFileDescriptor, {
    imageSize: options.imageSize,
    imageChecksum: options.imageChecksum,
    progress: options.progress
  });
};
