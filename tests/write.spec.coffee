m = require('mochainon')
Promise = require('bluebird')
fs = Promise.promisifyAll(require('fs'))
stringToStream = require('string-to-stream')
tmp = require('tmp')
diskio = require('diskio')
nock = require('nock')
request = require('resin-request')
settings = require('resin-settings-client')
tokens = require('./tokens.json')
imageWrite = require('../lib/write')

describe 'Image Write:', ->

	describe '.write()', ->

		describe 'given a temporal device', ->

			beforeEach ->
				@device = tmp.fileSync()

			# For some reason, calling the remove callback
			# in afterEach caused tmp.fileSync to not create
			# a file correctly in some cases in beforeEach.
			after ->
				@device.removeCallback()

			describe 'given a valid stream without size information', ->

				beforeEach ->
					message = 'Lorem ipsum dolor sit amet'
					@stream = stringToStream(message)

				it 'should throw an error', ->
					m.chai.expect =>
						imageWrite.write(@device.name, @stream)
					.to.throw('Stream size missing')

			describe 'given a valid stream', ->

				beforeEach ->
					message = 'Lorem ipsum dolor sit amet'
					@stream = stringToStream(message)
					@stream.length = Buffer.byteLength(message)

				it 'should be able to write the stream to a device', (done) ->

					# The operation takes some time on Windows for some reason.
					# By increasing the default timeout (2s) we make sure we
					# give Windows some space to do it's job.
					this.timeout(8000)

					emitter = imageWrite.write(@device.name, @stream)
					emitter.on 'done', =>
						fs.readFileAsync(@device.name, encoding: 'utf8').then (contents) ->

							# Windows, NodeJS v0.10, reads the file with some
							# trailing null bytes in some cases.
							# We make sure to remove them before checking the content.
							contents = contents.replace(/\0/g, '')

							m.chai.expect(contents).to.equal('Lorem ipsum dolor sit amet')

						.nodeify(done)

				describe 'given an error when writing the stream', ->

					beforeEach ->
						@diskioWriteStreamStub = m.sinon.stub(diskio, 'writeStream')
						@diskioWriteStreamStub.yields(new Error('diskio error'))

					afterEach ->
						@diskioWriteStreamStub.restore()

					it 'should emit an error event with the error', (done) ->
						emitter = imageWrite.write(@device.name, @stream)
						emitter.on 'error', (error) ->
							m.chai.expect(error).to.be.an.instanceof(Error)
							m.chai.expect(error.message).to.equal('diskio error')
							done()

			describe 'given a working /whoami endpoint', ->

				beforeEach ->
					apiUrl = settings.get('apiUrl')
					nock(apiUrl).get('/whoami')
						.reply(200, tokens.johndoe.token)

				afterEach ->
					nock.cleanAll()

				describe 'given a resin-request stream with content length information', ->

					beforeEach (done) ->
						apiUrl = settings.get('apiUrl')
						message = 'Lorem ipsum dolor sit amet'
						nock(apiUrl).get('/foo')
							.reply(200, message, 'Content-Length': String(message.length))
						request.stream
							url: '/foo'
							method: 'GET'
						.then (stream) =>
							@stream = stream
							done()

					afterEach ->
						nock.cleanAll()

					it 'should emit progress events', (done) ->
						emitter = imageWrite.write(@device.name, @stream)
						progressSpy = m.sinon.spy()
						emitter.on('progress', progressSpy)

						# A timeout is needed for the
						# progress event to be emitted.
						setTimeout ->
							m.chai.expect(progressSpy).to.have.been.called
							state = progressSpy.firstCall.args[0]
							m.chai.expect(state).to.have.interface
								delta: Number
								eta: Number
								length: Number
								percentage: Number
								remaining: Number
								runtime: Number
								speed: Number
								transferred: Number
							m.chai.expect(state.length).to.equal(26)
							done()
						, 500

				describe 'given a stream with a length property', ->

					beforeEach ->
						message = 'Lorem ipsum dolor sit amet'
						@stream = stringToStream(message)
						@stream.length = message.length

					it 'should emit progress events with the correct length', (done) ->
						emitter = imageWrite.write(@device.name, @stream)
						progressSpy = m.sinon.spy()
						emitter.on('progress', progressSpy)

						setTimeout ->
							m.chai.expect(progressSpy).to.have.been.called
							state = progressSpy.firstCall.args[0]
							m.chai.expect(state.length).to.equal(26)
							done()
						, 500
