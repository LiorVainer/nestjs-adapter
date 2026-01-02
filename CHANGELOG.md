# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - TBD

### ⚠️ BREAKING CHANGES

This release introduces significant API changes to improve clarity and developer experience. Please see [MIGRATION.md](./MIGRATION.md) for detailed upgrade instructions.

#### Decorator Renamed: `@Port` → `@Adapter`

The decorator has been renamed to better reflect its purpose in the hexagonal architecture pattern.

**Before:**
```typescript
@Port({ token: STORAGE_TOKEN, implementation: S3Service })
```

**After:**
```typescript
@Adapter({ portToken: STORAGE_TOKEN, implementation: S3Service })
```

#### Base Class Renamed: `Adapter` → `AdapterBase`

The base class has been renamed to avoid naming confusion with the decorator.

**Before:**
```typescript
class S3Adapter extends Adapter<S3Options> {}
```

**After:**
```typescript
class S3Adapter extends AdapterBase<S3Options> {}
```

#### Parameter Renamed: `token` → `portToken`

The decorator parameter has been renamed for better semantic clarity.

**Before:**
```typescript
@Port({ token: STORAGE_TOKEN, implementation: S3Service })
```

**After:**
```typescript
@Adapter({ portToken: STORAGE_TOKEN, implementation: S3Service })
```

### Added

- **Comprehensive Documentation**: New `docs/library.md` with complete API reference, architecture overview, advanced usage patterns, testing guide, and migration guide
- **CLI Documentation**: New `docs/cli.md` with detailed CLI commands, configuration, templates, and examples
- **Migration Guide**: Added `MIGRATION.md` to help users upgrade from v0.x to v1.x
- **Hybrid Configuration Support**: Adapters now support both static (decorator-based) and dynamic (hook-based) configuration
- **Enhanced Type Safety**: Improved TypeScript support throughout the library
- **Mermaid Architecture Diagrams**: Visual representation of hexagonal architecture in documentation

### Changed

- **Decorator Name**: `@Port` renamed to `@Adapter`
- **Base Class Name**: `Adapter` renamed to `AdapterBase`
- **Decorator Parameter**: `token` renamed to `portToken`
- **README Structure**: Restructured for better clarity with links to comprehensive documentation
- **CLI Templates**: Removed comments from generated code for better readability
- **Import/Export Structure**: Updated to export `Adapter` decorator and `AdapterBase` class separately

### Fixed

- Type safety improvements in adapter registration methods
- Proper merging of decorator configuration with hook-based configuration
- Enhanced error messages when decorator is missing or misconfigured

### Documentation

- Complete rewrite of README.md with quick start and clear documentation links
- New comprehensive library documentation in `docs/library.md`
- New CLI documentation in `docs/cli.md`
- Migration guide for upgrading from v0.x to v1.x
- Updated all examples to use new API
- Added hexagonal architecture flowchart with Mermaid
- Enhanced JSDoc comments throughout the codebase

---

## [0.2.4] - 2025-01-02

### Fixed

- Configure Biome to only lint src directory
- Configure release workflow for npm trusted publishing with OIDC
- Add npm configuration diagnostics to release workflow

## [0.2.3] - 2025-01-02

### Fixed

- Release workflow npm publishing configuration

## [0.2.2] - 2025-01-01

### Changed

- Build configuration improvements
- Release workflow enhancements

## [0.2.1] - 2025-01-01

### Fixed

- Build output configuration

## [0.2.0] - 2025-01-01

### Added

- Initial public release
- Core adapter pattern implementation
- CLI for generating adapters and ports
- TypeScript support
- Comprehensive testing suite

---

[Unreleased]: https://github.com/LiorVainer/nest-hex/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/LiorVainer/nest-hex/compare/v0.2.4...v1.0.0
[0.2.4]: https://github.com/LiorVainer/nest-hex/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/LiorVainer/nest-hex/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/LiorVainer/nest-hex/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/LiorVainer/nest-hex/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/LiorVainer/nest-hex/releases/tag/v0.2.0
