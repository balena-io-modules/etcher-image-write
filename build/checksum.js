
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var CRC32Stream, Promise, SliceStream, _;

CRC32Stream = require('crc32-stream');

SliceStream = require('slice-stream');

Promise = require('bluebird');

_ = require('lodash');


/**
 * @summary Calculate stream checksum from stream
 * @function
 * @protected
 *
 * @description
 *
 * @param {ReadableStream} stream - stream
 * @param {Object} options - options
 * @param {Number} options.bytes - bytes to calculate the checksum for
 *
 * @fulfil {String} - checksum
 * @returns {Promise}
 *
 * @example
 *
 * checksum.calculate fs.createReadStream('/dev/rdisk2'),
 * 	bytes: 1024 * 100
 * .then (result) ->
 * 	console.log(result)
 */

exports.calculate = function(stream, options) {
  if (options == null) {
    options = {};
  }
  return new Promise(function(resolve, reject) {
    var checksum, slice;
    if (options.bytes == null) {
      throw new Error('Missing bytes option');
    }
    if (_.any([!_.isNumber(options.bytes), _.isNaN(options.bytes), options.bytes <= 0])) {
      throw new Error("Invalid bytes option: " + options.bytes);
    }
    checksum = new CRC32Stream();
    checksum.on('data', _.noop);
    checksum.on('error', reject);
    checksum.on('end', function(error) {
      if (error != null) {
        return reject(error);
      }
      if (typeof stream.close === "function") {
        stream.close();
      }
      return resolve(checksum.hex().toLowerCase());
    });
    slice = new SliceStream({
      length: options.bytes
    }, function(buffer, isOnLimit) {
      this.push(buffer);
      if (isOnLimit) {
        return this.push(null);
      }
    });
    return stream.pipe(slice).pipe(checksum);
  });
};
