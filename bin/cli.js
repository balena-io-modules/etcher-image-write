#!/usr/bin/env node

'use strict';

var fs = require('fs');
var imageWrite = require('../lib/write');
var image = process.argv[2];
var device = process.argv[3];

if (!image || !device) {
  console.error('Usage: <image> <device>');
  process.exit(1);
}

var imageStream = fs.createReadStream(image);

console.log('Writing', image, 'to', device);

imageWrite.write(device, imageStream, {
  check: true,
  size: fs.statSync(image).size
})
  .on('progress', function(state) {
    console.log(state);
  })
  .on('error', function(error) {
    console.error(error);
  })
  .on('done', function() {
    console.log('Finished writing to device');
  });
