###
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
###

###*
# @module imageWrite
###

EventEmitter = require('events').EventEmitter
fs = require('fs')
_ = require('lodash')
Promise = require('bluebird')
progressStream = require('progress-stream')
StreamChunker = require('stream-chunker')
sliceStream = require('slice-stream2')
CRC32Stream = require('crc32-stream')
DevNullStream = require('dev-null-stream')
denymount = Promise.promisify(require('denymount'))
utils = require('./utils')
win32 = require('./win32')

CHUNK_SIZE = 65536 * 16 # 64K * 16 = 1024K = 1M

###*
# @summary Write a readable stream to a device
# @function
# @public
#
# @description
#
# **NOTICE:** You might need to run this function as sudo/administrator to
# avoid permission issues.
#
# The returned EventEmitter instance emits the following events:
#
# - `progress`: A progress event that passes a state object of the form:
#
#		{
#			type: 'write' // possible values: 'write', 'check'.
#			percentage: 9.05,
#			transferred: 949624,
#			length: 10485760,
#			remaining: 9536136,
#			eta: 10,
#			runtime: 0,
#			delta: 295396,
#			speed: 949624
#		}
#
# - `error`: An error event.
# - `done`: An event emitted with a boolean success value.
#
# Enabling the `check` option is useful to ensure the image was
# successfully written to the device. This is checked by calculating and
# comparing checksums from both the original image and the data written
# to the device.
#
# @param {String} device - device
# @param {ReadStream} stream - readable stream
# @param {Object} options - options
# @param {Number} options.size - input stream size
# @param {Boolean} [options.check=false] - enable write check
# @returns {EventEmitter} emitter
#
# @example
# myStream = fs.createReadStream('my/image')
#
# emitter = imageWrite.write '/dev/disk2', myStream,
# 	check: true
# 	size: fs.statSync('my/image').size
#
# emitter.on 'progress', (state) ->
# 	console.log(state)
#
# emitter.on 'error', (error) ->
# 	console.error(error)
#
# emitter.on 'done', (success) ->
# 	if success
# 		console.log('Success!')
# 	else
# 		console.log('Failed!')
###
exports.write = (device, stream, options = {}) ->
	emitter = new EventEmitter()

	if not options.size?
		throw new Error('Missing size option')

	device = utils.getRawDevice(device)

	# Prevent disks from auto-mounting, since some OSes, like
	# Windows and OS X, "touch" files in FAT partitions,
	# causing our checksum comparison to fail.
	denymount device, (callback) ->

		utils.eraseMBR(device).then(win32.prepare).then ->
			new Promise (resolve, reject) ->
				checksumStream = new CRC32Stream()

				stream
					.pipe(checksumStream)
					.pipe progressStream
						length: _.parseInt(options.size)
						time: 500
					.on 'progress', (state) ->
						state.type = 'write'
						emitter.emit('progress', state)
					.pipe(StreamChunker(CHUNK_SIZE, flush: true))
					.pipe(fs.createWriteStream(device, flags: 'rs+'))
					.on 'error', (error) ->
						error.type = 'write'
						return reject(error)
					.on 'close', ->
						return resolve
							checksum: checksumStream.hex().toLowerCase()
							size: checksumStream.size()

		.then (results) ->
			if not options.check
				return win32.prepare().then ->
					emitter.emit('done', true)

			new Promise (resolve, reject) ->
				checksumStream = new CRC32Stream()
				fs.createReadStream(device)

					# Only calculate the checksum from the bytes that correspond
					# to the original image size and not the whole drive since
					# the drive might contain empty space that changes the
					# resulting checksum.
					# See https://help.ubuntu.com/community/HowToMD5SUM#Check_the_CD
					.pipe(sliceStream(bytes: results.size))

					.pipe progressStream
						length: _.parseInt(results.size)
						time: 500
					.on 'progress', (state) ->
						state.type = 'check'
						emitter.emit('progress', state)
					.pipe(checksumStream)
					.pipe(new DevNullStream())
					.on 'error', (error) ->
						error.type = 'check'
						return reject(error)
					.on 'finish', ->
						return resolve(checksumStream.hex().toLowerCase())

			.tap(win32.prepare)
			.then (deviceChecksum) ->
				emitter.emit('done', results.checksum is deviceChecksum)
		.asCallback(callback)

	.catch (error) ->
		emitter.emit('error', error)

	return emitter
