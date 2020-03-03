# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## v9.1.6 - 2020-03-03

### Misc

- Update dependences

## v9.1.5 - 2019-05-29

### Misc

- update dependencies for Node 12 compilation

## v9.1.4 - 2019-01-10

### Misc

- Remove versionist
- Update drivelist to ^6.4.4

## v9.1.3 - 2017-05-09

### Changed

- Get rid of the `diskpart` optional Windows module

## v9.1.2 - 2017-04-21

### Changed

- Improve diskpart clean error message
- Throw `EUNPLUGGED` on `EBUSY` on macOS

## v9.1.1 - 2017-04-14

### Changed

- Throw `EUNPLUGGED` if an SD Card gets unplugged half-way through from an internal reader.

## v9.1.0 - 2017-04-14

### Changed

- Throw `EUNPLUGGED` if drive gets unplugged half-way through.

## v9.0.3 - 2017-04-13

### Changed

- Support Node.js v4.

## v9.0.2 - 2017-04-11

### Changed

- Properly throw the validation error object.

## v9.0.1 - 2017-03-06

### Misc

- **package:** Add Versionist & npm version hooks (#90)
- **editorconfig:** Disable trimming whitespace in Markdown (#89)
- Update dependencies (#88)
- Fix ENOSPC / EINVAL caused by chunk padding (#84)
- **package:** Update dependencies (#82)
- Update ImageStreamPosition unit tests (#81)

## [9.0.0] - 2017-01-05

### Changed

- Fix non-working CLI example.
- Retry read operations up to 10 times on `EIO`.
- Catch unhandled error events from the first stream of `utils.safePipe()`.
- Don't close drive file descriptor after validation.

## [8.1.5] - 2017-01-04

### Changed

- Retry write operations up to ten times when `EIO` is encountered.

## [8.1.4] - 2016-11-03

### Changed

- Align last block to 512K, and to 1M if the block exceeds 512K.

## [8.1.3] - 2016-09-23

### Changed

- Fix sporadic EPERM write errors on Windows.
- Don't consider buffer alignment bytes during the validation phase.

## [8.1.2] - 2016-09-21

### Changed

- Correctly slice drive stream when performing validation even if the image size refers to the compressed size.

## 8.1.1 - 2016-09-21 (YANKED)

## [8.1.0] - 2016-09-07

### Added

- Add `bytesToZeroOutFromTheBeginning` option for bmap writes.

## [8.0.0] - 2016-09-06

### Removed

- Remove `passedValidation` property from results and throw an `EVALIDATION` error instead.

## [7.0.1] - 2016-08-24

### Changed

- Don't throw `ENOSPC` if the drive capacity is equal to the image size.

## [7.0.0] - 2016-08-23

### Changed

- Take a file descriptor of the drive instead of a path.

## [6.1.1] - 2016-08-21

### Changed

- Fix certain bmap ranges not being written properly.

## [6.1.0] - 2016-08-17

### Added

- Add `bmap` support.

## [6.0.1] - 2016-07-28

### Changed

- Make sure the device file descriptor is closed after finishing validation.

## [6.0.0] - 2016-07-21

### Added

- Require drive size to be passed as an option.

### Changed

- Emit an `ENOSPC` if the drive has no remaining space.

## [5.0.3] - 2016-07-17

### Changed

- Retry `diskpart clean` up to five times if it fails.

## [5.0.2] - 2016-06-27

### Changed

- Fix regressing Windows `EPERM` issue.

## [5.0.1] - 2016-06-12

### Changed

- Fix Windows `EPERM` issue on certain drives.

## [5.0.0] - 2016-05-17

### Added

- Extend writing results to include the source CRC32 checksum.

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

[9.0.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v8.1.5...v9.0.0
[8.1.5]: https://github.com/resin-io-modules/etcher-image-write/compare/v8.1.4...v8.1.5
[8.1.4]: https://github.com/resin-io-modules/etcher-image-write/compare/v8.1.3...v8.1.4
[8.1.3]: https://github.com/resin-io-modules/etcher-image-write/compare/v8.1.2...v8.1.3
[8.1.2]: https://github.com/resin-io-modules/etcher-image-write/compare/v8.1.0...v8.1.2
[8.1.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v8.0.0...v8.1.0
[8.0.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v7.0.1...v8.0.0
[7.0.1]: https://github.com/resin-io-modules/etcher-image-write/compare/v7.0.0...v7.0.1
[7.0.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v6.1.1...v7.0.0
[6.1.1]: https://github.com/resin-io-modules/etcher-image-write/compare/v6.1.0...v6.1.1
[6.1.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v6.0.1...v6.1.0
[6.0.1]: https://github.com/resin-io-modules/etcher-image-write/compare/v6.0.0...v6.0.1
[6.0.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v5.0.3...v6.0.0
[5.0.3]: https://github.com/resin-io-modules/etcher-image-write/compare/v5.0.2...v5.0.3
[5.0.2]: https://github.com/resin-io-modules/etcher-image-write/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/resin-io-modules/etcher-image-write/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/resin-io-modules/etcher-image-write/compare/v4.0.2...v5.0.0
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
