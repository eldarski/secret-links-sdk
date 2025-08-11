# Changelog

All notable changes to the Secret Links SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-11

### Added
- Initial release of Secret Links SDK
- Core SecretLinksSDK class with full API
- Link validation and parsing functionality
- Adaptive polling with intelligent interval adjustment
- Support for ping and webhook link types
- Multiple link support with individual listener management
- TypeScript definitions and full type safety
- Error handling with automatic retry logic
- Debug mode for development
- Custom validation rules support
- Browser notification integration
- Framework examples (React, Vue, vanilla JavaScript)
- Express.js backend integration example
- Comprehensive documentation and integration guide

### Features
- **Zero External Dependencies**: No reliance on Secret Links infrastructure for runtime
- **Framework Agnostic**: Works with React, Vue, Angular, or vanilla JavaScript  
- **Adaptive Polling**: Intelligent polling that adjusts based on activity
- **Real-time Notifications**: Browser notification support
- **Error Recovery**: Robust error handling and automatic retry logic
- **Multiple Build Formats**: ES modules, UMD, and minified versions
- **CDN Support**: Available via jsDelivr and unpkg

### Distribution
- NPM package: `secret-links-sdk`
- CDN: `https://cdn.jsdelivr.net/npm/secret-links-sdk@1.0.0/dist/secret-links-sdk.min.js`
- GitHub: `https://github.com/eldarski/secret-links-sdk`

[Unreleased]: https://github.com/eldarski/secret-links-sdk/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/eldarski/secret-links-sdk/releases/tag/v1.0.0