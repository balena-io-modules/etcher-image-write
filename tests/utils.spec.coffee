m = require('mochainon')
utils = require('../lib/utils')

describe 'Utils:', ->

	describe '.getRawDevice()', ->

		it 'should return the raw device given an OS X disk', ->
			m.chai.expect(utils.getRawDevice('/dev/disk2')).to.equal('/dev/rdisk2')

		it 'should return the same device given a linux drive', ->
			m.chai.expect(utils.getRawDevice('/dev/sda1')).to.equal('/dev/sda1')

		it 'should return the same device given a Windows physical drive', ->
			m.chai.expect(utils.getRawDevice('\\\\.\\PHYSICALDRIVE1')).to.equal('\\\\.\\PHYSICALDRIVE1')
