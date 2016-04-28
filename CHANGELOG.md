# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [4.0.2] - 2016-04-28

### Changed

- Upgrade `bluebird` to `v3.3.5` to avoid incompatibilities in certain environments.

## [4.0.1] - 2016-04-27

### Changed

- Align unaligned images to prevent `EINVAL`.

## [4.0.0] - 2016-04-26

### Added

- Add a `size` required option.
- Add a `transform` option to pass a custom stream transform.

### Changed

- Remove the need for a custom `.length` property on streams.
- Heavy refactoring of the module.

### Removed

- Remove Resin.io mentions in error messages.

## [3.0.4] - 2016-04-20

### Changed

- Set a `type` property on thrown errors to identify their origin.

## [3.0.3] - 2016-04-15

### Changed

- Fix `stream.push() after EOF` with unaligned images.

## [3.0.2] - 2016-04-04

### Changed

- Fix race condition that caused some drives to be mounted before the check process in OS X.

## [3.0.1] - 2016-03-29

### Changed

- Make sure a 100% state event is emitted from the check.

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

[4.0.2]: https://github.com/resin-io-modules/etcher-image-write/compare/v4.0.1...v4.0.2
[4.0.1]: https://github.com/resin-io-modules/etcher-image-write/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v3.0.4...v4.0.0
[3.0.4]: https://github.com/resin-io-modules/etcher-image-write/compare/v3.0.3...v3.0.4
[3.0.3]: https://github.com/resin-io-modules/etcher-image-write/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/resin-io-modules/etcher-image-write/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/resin-io-modules/etcher-image-write/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.0.7...v2.1.0
[2.0.7]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.0.6...v2.0.7
[2.0.6]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.0.5...v2.0.6
[2.0.5]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/resin-io-modules/etcher-image-write/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v1.0.0...v2.0.0
