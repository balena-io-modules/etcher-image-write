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

CRC32Stream = require('crc32-stream')
SliceStream = require('slice-stream2')
Promise = require('bluebird')
progressStream = require('progress-stream')
_ = require('lodash')

###*
# @summary Calculate stream checksum from stream
# @function
# @protected
#
# @description
#
# @param {ReadableStream} stream - stream
# @param {Object} options - options
# @param {Number} options.bytes - bytes to calculate the checksum for
# @param {Function} [options.progress] - progress callback (state)
#
# @fulfil {String} - checksum
# @returns {Promise}
#
# @example
#
# checksum.calculate fs.createReadStream('/dev/rdisk2'),
# 	bytes: 1024 * 100
# 	progress: (state) ->
# 		console.log(state)
# .then (result) ->
# 	console.log(result)
###
exports.calculate = (stream, options = {}) ->
	return new Promise (resolve, reject) ->

		if not options.bytes?
			throw new Error('Missing bytes option')

		if _.any [
			not _.isNumber(options.bytes)
			_.isNaN(options.bytes)
			options.bytes <= 0
		]
			throw new Error("Invalid bytes option: #{options.bytes}")

		checksum = new CRC32Stream()

		# We have to "consume" the data for the
		# digest to start being calculated.
		checksum.on('data', _.noop)

		checksum.on('error', reject)
		checksum.on 'end', (error) ->
			return reject(error) if error?

			# Make sure to close the input stream.
			# If we're only calculating a checksum of part
			# of the input stream, then there will be
			# remaining data and thus the stream will not
			# close automatically, leading to the client
			# application never exiting.
			stream.close?()

			# In some cases, a 100% progress state is never emitted.
			# The last state we get is 98% or 99%.
			# Since client code (like progress bars) might rely on
			# a 100% state being emitted, we manually emit ourselves.
			options.progress?({
				percentage: 100
				transferred: options.bytes
				length: options.bytes
				remaining: 0
				eta: 0
				runtime: 0
				delta: 0
				speed: 0
			})

			resolve(checksum.hex().toLowerCase())

		slice = new SliceStream
			length: options.bytes
		, (buffer, isOnLimit) ->
			@push(buffer)
			return @push(null) if isOnLimit

		progress = progressStream
			length: _.parseInt(options.bytes)
			time: 500

		progress.on('progress', options.progress or _.noop)

		stream.pipe(progress).pipe(slice).pipe(checksum)
