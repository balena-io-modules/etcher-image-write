# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [3.0.0] - 2016-03-29

### Added

- Add easy to use example script.
- Report checking progress.

### Changed

- Integrate checking to the `.write()` function.


### Removed

- Remove `.check()`.

## [2.1.0] - 2016-02-16

### Added

- Implement `.check()` to ensure an image was written correctly.

## [2.0.7] - 2015-12-04

### Changed

- Omit tests from NPM package.

## [2.0.6] - 2015-11-24

- Upgrade `tmp` to v0.0.28.

## [2.0.5] - 2015-10-20

### Changed

- Improve generic `EINVAL` error message.

## [2.0.4] - 2015-10-05

### Changed

- Drastically increase speed on OS X by using raw devices.

## [2.0.3] - 2015-09-11

### Changed

- Set chunk size to 1M to improve writing time.

## [2.0.2] - 2015-09-10

### Added

- Chunk stream in 1024 bytes blocks.

## [2.0.1] - 2015-09-07

### Changed

- Upgrade `resin-settings-client` to v3.0.0.

## [2.0.0] - 2015-08-24

### Changed

- Throw an error if no stream size information.
- Fix test suite Windows issues on NodeJS v0.10.

[3.0.0]: https://github.com/resin-io-modules/resin-image-write/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/resin-io-modules/resin-image-write/compare/v2.0.7...v2.1.0
[2.0.7]: https://github.com/resin-io-modules/resin-image-write/compare/v2.0.6...v2.0.7
[2.0.6]: https://github.com/resin-io-modules/resin-image-write/compare/v2.0.5...v2.0.6
[2.0.5]: https://github.com/resin-io-modules/resin-image-write/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/resin-io-modules/resin-image-write/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/resin-io-modules/resin-image-write/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/resin-io-modules/resin-image-write/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/resin-io-modules/resin-image-write/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/resin-io-modules/resin-image-write/compare/v1.0.0...v2.0.0
