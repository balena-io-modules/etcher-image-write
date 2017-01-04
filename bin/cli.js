#!/usr/bin/env node

'use strict';

const fs = require('fs');
const imageWrite = require('../lib/write');
const image = process.argv[2];
const device = process.argv[3];

if (!image || !device) {
  console.error('Usage: <image> <device>');
  process.exit(1);
}

const imageStream = fs.createReadStream(image);

console.log('Writing', image, 'to', device);

imageWrite.write(device, imageStream, {
  check: true,
  size: fs.statSync(image).size
})
  .on('progress', (state) => {
    console.log(state);
  })
  .on('error', (error) => {
    console.error(error);
  })
  .on('done', () => {
    console.log('Finished writing to device');
  });
