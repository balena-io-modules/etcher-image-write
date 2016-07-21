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

var fs = require('fs');
var _ = require('lodash');
var drivelist = require('drivelist');
var imageWrite = require('./lib/write');

var image = process.argv[2];
var device = process.argv[3];

function onError(error) {
  console.error(error.message);
  process.exit(1);
}

if (!image || !device) {
  onError(new Error('Usage: example.js <image> <device>'));
}

drivelist.list(function(error, drives) {
  if (error) {
    return onError(error);
  }

  var selectedDrive = _.find(drives, {
    device: device
  });

  if (!selectedDrive) {
    return onError(new Error('Drive not found: ' + device));
  }

  imageWrite.write(selectedDrive, {
    stream: fs.createReadStream(image),
    size: fs.statSync(image).size
  }, {
    check: true
  })
    .on('error', onError)
    .on('progress', function(state) {
      console.log(state);
    })
    .on('done', function(success) {
      if (success) {
        console.log('Check passed');
      } else {
        console.error('Check failed');
      }
    });
});

