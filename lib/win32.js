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

const Promise = require('bluebird');
const retry = require('bluebird-retry');
const os = require('os');
const _ = require('lodash');

const runDiskpartScript = (script) => {
  return Promise.try(() => {
    if (os.platform() === 'win32') {
      const diskpart = Promise.promisifyAll(require('diskpart'));
      return diskpart.evaluateAsync(script).delay(2000);
    }
  });
};

/**
 * @summary Prepare Windows drives
 * @function
 * @protected
 *
 * @description
 * This function runs cleans the drive, converting it into
 * a "RAW" device, which no filesystem, so Windows direct
 * access policies can allow us to arbitrarily write to it.
 *
 * It will do nothing if not being run in Windows.
 *
 * @param {String} device - device
 * @returns {Promise}
 *
 * @example
 * win32.prepare('\\\\.\\PHYSICALDRIVE1');
 */
exports.prepare = (device) => {
  return Promise.try(() => {
    const deviceId = _.nth(device.match(/PHYSICALDRIVE(\d+)/i), 1);

    if (deviceId) {
      return retry(() => {
        return runDiskpartScript([
          'select disk ' + deviceId,
          'clean',
          'rescan'
        ]);
      }, {

        /* eslint-disable camelcase */

        max_tries: 5

        /* eslint-enable camelcase */

      }).catch((error) => {
        throw new Error(`Couldn't clean the drive, ${error.failure.message} (code ${error.failure.code})`);
      });
    }
  });
};

/**
 * @summary Rescan Windows drives
 * @function
 * @protected
 *
 * It will do nothing if not being run in Windows.
 *
 * @returns {Promise}
 *
 * @example
 * win32.rescan();
 */
exports.rescan = () => {
  return runDiskpartScript([
    'rescan'
  ]);
};
