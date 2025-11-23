# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2025-11-23

### Added

- X-Author header support in `tapStream()` via new `author` option in TapOptions
- Allows tracking of stream origins by sending an 'X-Author' header with uploads

### Changed

- Refactored test mocks for improved consistency and clarity
- Simplified async iterator cancellation logic in `fromAsyncIterator`
- Enhanced project positioning as streaming-first telemetry SDK in documentation

### Fixed

- Minor code improvements and formatting enhancements

## [0.4.0] - 2025-11-20

### BREAKING CHANGES

- **Removed `compression` option from user-facing API** - Compression is now automatic and always uses gzip
- **Removed `CompressionStrategy` type export** - No longer needed as compression strategy cannot be configured
- All uploads are now automatically compressed with gzip before being sent to the Guardian ingest service
- This change ensures compatibility with the server which always expects gzipped data

### Changed

- Compression is now applied internally and automatically (not user-configurable)
- Simplified compression utility to gzip-only implementation
- Updated all documentation to reflect automatic compression

### Rationale

The Guardian ingest server always expects gzip-compressed data. Making compression optional caused confusion and potential upload failures when users didn't enable it or chose incompatible compression methods. By enforcing gzip compression automatically, we ensure reliable uploads and reduce configuration complexity.

### Migration Guide

If you were using the `compression` option:

**Before (v0.3.x):**
```typescript
const { client, upload } = tap(stream, {
  compression: 'gzip',
  apiKey: 'your-key'
});
```

**After (v0.4.0):**
```typescript
// Simply remove the compression option - it's now automatic
const { client, upload } = tap(stream, {
  apiKey: 'your-key'
});
```

Data is automatically compressed with gzip before upload. No configuration needed.

## [0.3.1] - 2025-11-20

### Fixed

- **CRITICAL**: Fixed upload failure in `tap()` function caused by default gzip compression creating backpressure deadlock in Web Streams tee
- Compression now defaults to 'none' (matching `tapStream()` behavior) to prevent blocking when client stream is not immediately consumed

## [0.3.0] - 2025-11-20

### Added

- Simplified `tap()` convenience function with automatic stream type detection
- Auto-detection support for Response, Node.js streams, and Web ReadableStreams
- Default gzip compression for better performance out of the box
- Comprehensive implementation examples in README (Next.js, Vercel AI SDK, Express)
- Production-ready integration patterns with session tracking
- npm package badge and links in README

### Changed

- README Quick Start updated to showcase simplified `tap()` API
- ESLint configuration enhanced with NodeJS global type definition

## [0.2.0] - 2025-10-08

### Added

- Core stream tapping functionality with `tapStream()` API
- Multiple stream adapters: `fromAsyncIterator`, `fromNodeStream`, `fromResponse`
- Compression support for gzip, deflate, and brotli
- Upload functionality with configurable endpoints and authentication
- Customizable logger with namespace and log level support
- Stream utilities including `streamTee` for stream forking
- Comprehensive test suite for core functionality
- TypeScript type definitions and full type safety

### Fixed

- TypeScript compilation errors with ReadableStream imports
- Type assertion issues in Node.js stream conversion
- Duplex property type error in fetch RequestInit
- ESLint configuration updated to flat config format

### Changed

- Upgraded dev dependencies to latest versions (Jest 30, ESLint 9, TypeScript 5.9)

## [0.1.0] - 2025-10-08

### Added

- Initial project scaffolding
- Basic package configuration
