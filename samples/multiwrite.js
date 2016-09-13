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
const fs = Bluebird.promisifyAll(require('fs'));
const _ = require('lodash');
const drivelist = Bluebird.promisifyAll(require('drivelist'));
const PassThroughStream = require('stream').PassThrough;
const imageWrite = require('../lib/index');

const image = process.argv[2];
const drives = process.argv[3];

function onError(error) {
  console.error(error.message);
  process.exit(1);
}

if (!image || !drives) {
  onError(new Error('Usage: multiwrite.js <image> <drive1,drive2,...,driveN>'));
}

const openDrive = (device) => {
  return drivelist.listAsync().then((drives) => {
    const selectedDrive = _.find(drives, {
      device: device
    });

    if (!selectedDrive) {
      throw new Error(`Drive not found: ${device}`);
    }

    return {
      fd: fs.openSync(selectedDrive.raw, 'rs+'),
      device: selectedDrive.raw,
      size: selectedDrive.size
    };
  });
};

return Bluebird.all(_.map(drives.split(','), openDrive)).then((drives) => {
  const emitter = imageWrite.multiwrite(drives, {
    stream: fs.createReadStream(image),
    size: fs.statSync(image).size
  }, {
    check: true
  });

  emitter.on('error', onError);

  emitter.on('progress', function(state) {
    const speedInMegabytes = Math.floor(state.speed / 1e+6 * 100) / 100;
    console.log(`${state.drive} (${state.type}) -> ${Math.floor(state.percentage)}% (at ${speedInMegabytes} MB/s)`);
  });

  emitter.on('done', function(results) {
    console.log(results);
  });

});

