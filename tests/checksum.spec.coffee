m = require('mochainon')
rindle = require('rindle')
checksum = require('../lib/checksum')

describe 'Checksum:', ->

	describe '.calculate()', ->

		it 'should be rejected if no options param', ->
			string = 'Lorem ipsum dolor sit amet'
			promise = checksum.calculate(rindle.getStreamFromString(string))
			m.chai.expect(promise).to.be.rejectedWith('Missing bytes option')

		it 'should be rejected if no bytes', ->
			string = 'Lorem ipsum dolor sit amet'
			promise = checksum.calculate(rindle.getStreamFromString(string), {})
			m.chai.expect(promise).to.be.rejectedWith('Missing bytes option')

		it 'should be rejected if bytes is not a number', ->
			string = 'Lorem ipsum dolor sit amet'
			promise = checksum.calculate rindle.getStreamFromString(string),
				bytes: 'foobar'
			m.chai.expect(promise).to.be.rejectedWith('Invalid bytes option: foobar')

		it 'should be rejected if bytes is NaN', ->
			string = 'Lorem ipsum dolor sit amet'
			promise = checksum.calculate rindle.getStreamFromString(string),
				bytes: NaN
			m.chai.expect(promise).to.be.rejectedWith('Invalid bytes option: NaN')

		it 'should be rejected if bytes is a negative number', ->
			string = 'Lorem ipsum dolor sit amet'
			promise = checksum.calculate rindle.getStreamFromString(string),
				bytes: -10
			m.chai.expect(promise).to.be.rejectedWith('Invalid bytes option: -10')

		it 'should be rejected if bytes is zero', ->
			string = 'Lorem ipsum dolor sit amet'
			promise = checksum.calculate rindle.getStreamFromString(string),
				bytes: 0
			m.chai.expect(promise).to.be.rejectedWith('Invalid bytes option: 0')

		# crc32 expected hashes got from
		# http://www.fileformat.info/tool/hash.htm

		it 'should calculate the checksum from a stream', (done) ->
			string = 'Lorem ipsum dolor sit amet'
			checksum.calculate rindle.getStreamFromString(string),
				bytes: string.length
			.then (result) ->
				m.chai.expect(result).to.equal('5f29d461')
			.nodeify(done)

		it 'should emit a final 100% progress state', (done) ->
			percentage = null

			string = 'Lorem ipsum dolor sit amet'
			checksum.calculate rindle.getStreamFromString(string),
				bytes: string.length
				progress: (state) ->
					percentage = state.percentage
			.then ->
				m.chai.expect(percentage).to.equal(100)
			.nodeify(done)

		it 'should ignore overflow bytes and return a checksum for the whole stream', (done) ->
			string = 'Lorem ipsum dolor sit amet'
			checksum.calculate rindle.getStreamFromString(string),
				bytes: 999999999999999
			.then (result) ->
				m.chai.expect(result).to.equal('5f29d461')
			.nodeify(done)

		it 'should calculate the checksum from a part of a stream', (done) ->
			string = 'Lorem ipsum dolor sit amet'
			checksum.calculate rindle.getStreamFromString(string),
				bytes: 11
			.then (result) ->
				m.chai.expect(result).to.equal('f44bfb59')
			.nodeify(done)
