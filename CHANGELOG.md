# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
