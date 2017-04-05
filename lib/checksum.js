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
const sliceStream = require('slice-stream2');
const progressStream = require('progress-stream');
const ImageReadStream = require('./image-read-stream');
const ChecksumStream = require('./checksum-stream');

/**
 * @summary Calculate device checksum
 * @function
 * @public
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {Number} options.imageSize - image size in bytes
 * @param {Number} options.chunkSize - chunk size
 * @param {String[]} options.checksumAlgorithms - checksum hash algorithms
 * @param {Function} options.progress - progress callback (state)
 * @fulfil {String} - checksum
 * @returns {Promise}
 *
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * checksum.calculateDeviceChecksum(fd, {
 *   imageSize: 65536 * 128,
 *   chunkSize: 65536 * 16,
 *   checksumAlgorithms: [ 'crc32', 'md5' ],
 *   progress: (state) => {
 *     console.log(state);
 *   }
 * }).then((deviceChecksum) => {
 *   console.log(deviceChecksum);
 * });
 */
exports.calculateDeviceChecksum = (deviceFileDescriptor, options = {}) => {

  return new Bluebird((resolve, reject) => {

    const imageStream = new ImageReadStream(deviceFileDescriptor, {
      chunkSize: options.chunkSize
    });

    // Only calculate the checksum from the bytes that correspond
    // to the original image size and not the whole drive since
    // the drive might contain empty space that changes the
    // resulting checksum.
    // See https://help.ubuntu.com/community/HowToMD5SUM#Check_the_CD
    const slice = sliceStream({
      bytes: options.imageSize
    });

    const progress = progressStream({
      length: options.imageSize,
      time: 500
    });

    const checksum = new ChecksumStream({
      algorithms: options.checksumAlgorithms
    });

    imageStream.once('error', reject)
      .pipe(slice).once('error', reject)
      .pipe(checksum).once('error', reject)
      .once('result', resolve)
      .pipe(progress).once('error', reject)
      .resume();

    if (options.progress) {
      progress.on('progress', options.progress);
    }

  });

};
