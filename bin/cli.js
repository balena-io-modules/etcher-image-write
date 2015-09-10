#!/usr/bin/env node

var fs = require('fs');
var imageWrite = require('../build/write');
var image = process.argv[2];
var device = process.argv[3];

if (!image || !device) {
	console.error('Usage: <image> <device>');
	process.exit(1);
}

var imageStream = fs.createReadStream(image);
imageStream.length = fs.statSync(image).size;

console.log('Writing', image, 'to', device, '-', imageStream.length, 'bytes')

imageWrite.write(device, imageStream)
	.on('progress', function(state) {
		console.log(state);
	})
	.on('error', function(error) {
		console.error(error);
	})
	.on('done', function() {
		console.log('Finished writing to device');
	});
