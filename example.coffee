fs = require('fs')
imageWrite = require('./lib/write')

image = process.argv[2]
drive = process.argv[3]

if not image? or not drive?
	console.error('Usage: coffee example.coffee <image> <drive>')
	process.exit(1)

console.log("Writing #{image} to #{drive}\n")

getImageStream = ->
	stream = fs.createReadStream(image)
	stream.length = fs.statSync(image).size
	return stream

emitter = imageWrite.write(drive, getImageStream())

emitter.on 'progress', (state) ->
	console.log("#{Math.floor(state.percentage)}% (#{state.transferred}/#{state.length}) eta #{state.eta}s")

emitter.on 'error', (error) ->
	console.error(error)
	process.exit(1)

emitter.on 'done', ->
	console.log('Checking...')

	imageWrite.check(drive, getImageStream()).then (success) ->
		if success
			console.log('The write was successful!')
		else
			console.error('The write failed!')
			process.exit(1)
