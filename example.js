var fs = require('fs');
var imageWrite = require('./build/write');

var image = process.argv[2];
var drive = process.argv[3];

if (!image || !drive) {
	onError(new Error('Usage: example.js <image> <drive>'));
}

function onError(error) {
	console.error(error.message);
	process.exit(1);
}

stream = fs.createReadStream(image);
stream.length = fs.statSync(image).size;

imageWrite.write(drive, stream, { check: true })
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
