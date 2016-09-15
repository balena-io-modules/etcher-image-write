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
const retry = require('bluebird-retry');
const os = require('os');
const _ = require('lodash');
const isWindows = os.platform() === 'win32';

if (isWindows) {
  var diskpart = Bluebird.promisifyAll(require('diskpart'));
}

/**
 * @summary Safely pipe multiple streams
 * @function
 * @public
 *
 * @description
 * This function attaches error handlers to all streams
 * in the pipe, providing a central place to handle errors.
 *
 * @param {Object[]} streams - streams
 * @param {Function} callback - error handler (error)
 *
 * @example
 * utils.safePipe([
 *   {
 *     stream: mystream
 *   },
 *   {
 *     stream: mystream2,
 *     events: {
 *       myevent: () => {
 *         console.log('`myevent` was emitted');
 *       }
 *     }
 *   }
 * ], (error) => {
 *   console.error('An error happened!');
 *   console.error(error);
 * });
 */
exports.safePipe = (streams, callback) => {
  var current = null;

  _.each(streams, function(stream) {
    if (!current) {
      current = stream.stream;
      return;
    }

    stream.stream.on('error', callback);

    _.each(stream.events || {}, function(handler, event) {
      stream.stream.on(event, handler);
    });

    current = current.pipe(stream.stream);
  });
};

/**
 * @summary Redirect event to from an event emitter to another
 * @function
 * @public
 *
 * @param {EventEmitter} inputEmitter - input emitter
 * @param {EventEmitter} outputEmitter - output emitter
 * @param {String} eventName - event name
 *
 * @example
 * const emitter1 = new EventEmitter();
 * const emitter2 = new EventEmitter();
 *
 * utils.redirectEvent(emitter1, emitter2, 'myevent');
 */
exports.redirectEvent = (inputEmitter, outputEmitter, eventName) => {
  inputEmitter.on(eventName, (argument) => {
    outputEmitter.emit(eventName, argument);
  });
};

/**
 * @summary Run a diskpart script
 * @function
 * @private
 *
 * @description
 * This function does nothing if not being ran in Windows.
 *
 * If a command is indeed ran, we add a 2 seconds delay to make
 * sure the changes we introduced are awknowledged by the operating
 * system (needed for some Windows 7 systems).
 *
 * @param {String[]} script - script commands
 * @returns {Promise}
 *
 * @example
 * runDiskpartScript([ 'rescan' ]).then(() => {
 *   console.log('Drives have been rescanned');
 * });
 */
const runDiskpartScript = (script) => {
  return Bluebird.try(() => {
    if (isWindows) {
      return diskpart.evaluateAsync(script).delay(2000);
    }
  });
};

/**
 * @summary Prepare a drive
 * @function
 * @protected
 *
 * @description
 * This function cleans the drives, converting them into
 * "RAW" devices, which no filesystem, so Windows direct
 * access policies can allow us to arbitrarily write to it.
 *
 * It will do nothing at the moment if not being run in Windows.
 *
 * @param {String[]} devices - devices
 * @returns {Promise}
 *
 * @example
 * utils.prepareDrives([
 *   '\\\\.\\PHYSICALDRIVE1',
 *   '\\\\.\\PHYSICALDRIVE2'
 * ]);
 */
exports.prepareDrives = (devices) => {
  return Bluebird.try(() => {
    const script = _.compact(_.map(devices, (device) => {
      const deviceId = _.nth(device.match(/PHYSICALDRIVE(\d+)/i), 1);

      if (!deviceId) {
        return null;
      }

      return [
        `select disk ${deviceId}`,
        'clean'
      ];
    }));

    if (!_.isEmpty(script)) {
      return retry(() => {
        return runDiskpartScript(script);
      }, {
        max_tries: 5
      });
    }
  });
};

/**
 * @summary Rescan drives
 * @function
 * @protected
 *
 * @description
 * It will do nothing if not being run in Windows.
 *
 * @returns {Promise}
 *
 * @example
 * utils.rescanDrives();
 */
exports.rescanDrives = function() {
  return runDiskpartScript([ 'rescan' ]);
};
