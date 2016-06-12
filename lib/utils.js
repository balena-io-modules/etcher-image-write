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
 * @summary Get raw device file
 * @function
 * @protected
 *
 * @description
 * This function only performs manipulations for OS X disks.
 * See http://superuser.com/questions/631592/why-is-dev-rdisk-about-20-times-faster-than-dev-disk-in-mac-os-x
 *
 * @param {String} device - device
 * @returns {String} raw device
 *
 * @example
 * var rawDevice = utils.getRawDevice('/dev/disk2');
 */
exports.getRawDevice = function(device) {
  var match = device.match(/\/dev\/disk(\d+)/);

  if (!match) {
    return device;
  }

  return '/dev/rdisk' + match[1];
};
