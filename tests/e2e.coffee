m = require('mochainon')
path = require('path')
wary = require('wary')
Promise = require('bluebird')
fs = Promise.promisifyAll(require('fs'))
imageWrite = require('../lib/write')

RANDOM1 = path.join(__dirname, 'images', '1.random')
RANDOM2 = path.join(__dirname, 'images', '2.random')

wary.it 'write() should be able to burn data to a file',
	random1: RANDOM1
	random2: RANDOM2
, (images) ->
	Promise.fromNode (callback) ->
		stream = fs.createReadStream(images.random1)
		stream.length = fs.statSync(images.random1).size
		writer = imageWrite.write(images.random2, stream)
		writer.on('error', callback)
		writer.on('done', callback)
	.then ->
		Promise.props
			random1: fs.readFileAsync(images.random1)
			random2: fs.readFileAsync(images.random2)
		.then (results) ->
			m.chai.expect(results.random1).to.deep.equal(results.random2)

wary.it 'write() should be rejected if the stream has no length',
	random1: RANDOM1
	random2: RANDOM2
, (images) ->
	promise = Promise.fromNode (callback) ->
		stream = fs.createReadStream(images.random1)
		writer = imageWrite.write(images.random2, stream)
		writer.on('error', callback)
		writer.on('done', callback)

	m.chai.expect(promise).to.be.rejectedWith('Stream size missing')

wary.run().catch (error) ->
	console.error(error.message)
	process.exit(1)
