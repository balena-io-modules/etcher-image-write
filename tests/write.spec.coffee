m = require('mochainon')
Promise = require('bluebird')
fs = Promise.promisifyAll(require('fs'))
stringToStream = require('string-to-stream')
tmp = require('tmp')
diskio = require('diskio')
nock = require('nock')
request = require('resin-request')
settings = require('resin-settings-client')
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

			describe 'given a valid stream', ->

				beforeEach ->
					@stream = stringToStream('Lorem ipsum dolor sit amet')

				it 'should be able to write the stream to a device', (done) ->
					emitter = imageWrite.write(@device.name, @stream)
					emitter.on 'done', =>
						filePromise = fs.readFileAsync(@device.name, encoding: 'utf8')
						m.chai.expect(filePromise).to.eventually.equal('Lorem ipsum dolor sit amet')
						done()

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

			describe 'given a resin-request stream with content length information', ->

				beforeEach (done) ->
					remoteUrl = settings.get('remoteUrl')
					message = 'Lorem ipsum dolor sit amet'
					nock(remoteUrl).get('/foo')
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

					# A tiny timeout is needed for the
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
					, 1

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
					, 1
