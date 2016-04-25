m = require('mochainon')
path = require('path')
wary = require('wary')
Promise = require('bluebird')
fs = Promise.promisifyAll(require('fs'))
imageWrite = require('../lib/write')

RANDOM1 = path.join(__dirname, 'images', '1.random')
RANDOM2 = path.join(__dirname, 'images', '2.random')
RANDOM3 = path.join(__dirname, 'images', '3.random')

wary.it 'write: should be able to burn data to a file',
	random1: RANDOM1
	random2: RANDOM2
, (images) ->
	return new Promise (resolve, reject) ->
		stream = fs.createReadStream(images.random1)
		writer = imageWrite.write images.random2, stream,
			size: fs.statSync(images.random1).size
		writer.on('error', reject)
		writer.on('done', resolve)
	.then (passed) ->
		m.chai.expect(passed).to.be.true

		Promise.props
			random1: fs.readFileAsync(images.random1)
			random2: fs.readFileAsync(images.random2)
		.then (results) ->
			m.chai.expect(results.random1).to.deep.equal(results.random2)

wary.it 'write: should be rejected if the size is missing',
	random1: RANDOM1
	random2: RANDOM2
, (images) ->
	promise = new Promise (resolve, reject) ->
		stream = fs.createReadStream(images.random1)
		writer = imageWrite.write(images.random2, stream, size: null)
		writer.on('error', reject)
		writer.on('done', resolve)

	m.chai.expect(promise).to.be.rejectedWith('Missing size option')

wary.it 'check: should eventually be true on success',
	random1: RANDOM1
	random2: RANDOM2
, (images) ->

	return new Promise (resolve, reject) ->
		stream = fs.createReadStream(images.random1)
		writer = imageWrite.write images.random2, stream,
			check: true
			size: fs.statSync(images.random1).size
		writer.on('error', reject)
		writer.on('done', resolve)
	.then (passed) ->
		m.chai.expect(passed).to.be.true

wary.it 'check: should eventually be false on failure',
	random1: RANDOM1
	random2: RANDOM2
	random3: RANDOM3
, (images) ->
	stream = fs.createReadStream(images.random1)
	stream2 = fs.createReadStream(images.random3)

	createReadStreamStub = m.sinon.stub(fs, 'createReadStream')
	createReadStreamStub.returns(stream2)

	return new Promise (resolve, reject) ->
		writer = imageWrite.write images.random2, stream,
			check: false
			size: fs.statSync(images.random1).size
		writer.on('error', reject)
		writer.on('done', resolve)
	.then (passed) ->
		m.chai.expect(passed).to.be.true
		createReadStreamStub.restore()

wary.run().catch (error) ->
	console.error(error.message)
	console.error(error.stack)
	process.exit(1)
