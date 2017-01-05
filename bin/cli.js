#!/usr/bin/env node

'use strict';

const drivelist = require('drivelist');
const _ = require('lodash');
const fs = require('fs');
const imageWrite = require('../lib/index');
const image = process.argv[2];
const device = process.argv[3];

const handleError = (error) => {
  console.error(error.message || error);
  process.exit(1);
};

if (!image || !device) {
  handleError('Usage: <image> <device>');
}

drivelist.list((error, drives) => {
  if (error) {
    return handleError(error);
  }

  const drive = _.find(drives, {
    device
  });

  if (!drive) {
    return handleError(`Unknown device: ${device}`);
  }

  console.log('Writing', image, 'to', device);

  imageWrite.write({
    fd: fs.openSync(drive.raw, 'rs+'),
    device: drive.raw,
    size: drive.size
  }, {
    stream: fs.createReadStream(image),
    size: fs.statSync(image).size
  }, {
    check: true
  })
    .on('error', handleError)
    .on('progress', (state) => {
      console.log(state);
    })
    .on('done', (results) => {
      console.log('Finished writing to device');
      console.log(JSON.stringify(results, null, 2));
    });
});
