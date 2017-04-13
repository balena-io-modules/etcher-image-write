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

const _ = require('lodash');
const Bluebird = require('bluebird');
const sliceStream = require('slice-stream2');
const progressStream = require('progress-stream');
const CRC32Stream = require('crc32-stream');
const DevNullStream = require('dev-null-stream');
const ImageReadStream = require('./image-read-stream');
const utils = require('./utils');

/**
 * @summary Calculate device checksum
 * @function
 * @public
 *
 * @param {Number} deviceFileDescriptor - device file descriptor
 * @param {Object} options - options
 * @param {Number} options.imageSize - image size in bytes
 * @param {Number} options.chunkSize - chunk size
 * @param {Function} options.progress - progress callback (state)
 * @fulfil {String} - checksum
 * @returns {Promise}
 *
 * const fd = fs.openSync('/dev/rdisk2', 'rs+');
 * checksum.calculateDeviceChecksum(fd, {
 *   imageSize: 65536 * 128,
 *   chunkSize: 65536 * 16
 *   progress: (state) => {
 *     console.log(state);
 *   }
 * }).then((deviceChecksum) => {
 *   console.log(deviceChecksum);
 * });
 */
exports.calculateDeviceChecksum = (deviceFileDescriptor, options) => {
  const checksumStream = new CRC32Stream();

  return new Bluebird((resolve, reject) => {
    utils.safePipe([
      {
        stream: new ImageReadStream(deviceFileDescriptor, {
          chunkSize: options.chunkSize
        })
      },
      {

        // Only calculate the checksum from the bytes that correspond
        // to the original image size and not the whole drive since
        // the drive might contain empty space that changes the
        // resulting checksum.
        // See https://help.ubuntu.com/community/HowToMD5SUM#Check_the_CD
        stream: sliceStream({
          bytes: options.imageSize
        })

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
        stream: checksumStream
      },
      {

        // The checksum stream needs to be piped somewhere
        // so data starts going through it and it actually
        // starts calculating the checksum.
        stream: new DevNullStream()

      }
    ], (error) => {
      if (error) {
        return reject(error);
      }

      return resolve(checksumStream.hex().toLowerCase());
    });
  });
};
