# Change: Add Comprehensive Testing for CLI Generators

## Why

The CLI generators are currently functional (35/191 tasks complete in add-cli-generator) but lack comprehensive test coverage to ensure:
- Generated output matches expected structure and content
- All nest-hex.config.ts configuration parameters work correctly (naming, style, output paths, templates)
- Edge cases and error conditions are handled properly
- Cross-platform compatibility (Windows, macOS, Linux)
- Configuration variations produce correct outputs

Without thorough testing, we risk:
- Breaking changes going undetected during refactoring
- Configuration options that silently fail or are ignored
- Platform-specific bugs in production
- Generated code that doesn't follow library conventions

## What Changes

- **Comprehensive test suite** for all 3 generators (PortGenerator, AdapterGenerator, ServiceGenerator)
- **Configuration validation tests** verifying all nest-hex.config.ts parameters:
  - `output.portsDir` and `output.adaptersDir` - custom output paths
  - `naming.portSuffix`, `naming.adapterSuffix`, `naming.fileCase` - naming conventions
  - `style.indent`, `style.quotes`, `style.semicolons` - code style preferences
  - `templates.*` - custom template support
- **Generated output validation**:
  - File structure and naming correctness
  - TypeScript compilation without errors
  - Content matches expected patterns
  - Import paths are correct and relative
  - Token naming follows conventions
- **Edge case testing**:
  - Missing directories (should create them)
  - Conflicting files (with and without --force)
  - Invalid configuration values
  - Cross-platform path handling
- **Integration tests** that run the full generation pipeline
- **Snapshot testing** for generated file contents

## Impact

### Affected Specs
- `cli-generator` - Adding testing requirements

### Affected Code
- New directory: `tests/cli/` - CLI test suite
  - `tests/cli/generators/` - Generator-specific tests
  - `tests/cli/config/` - Configuration loading and validation tests
  - `tests/cli/utils/` - Utility function tests
  - `tests/cli/fixtures/` - Test fixtures (sample configs, expected outputs)
- New test utilities for comparing generated outputs

### Breaking Changes
**None** - This is purely additive testing infrastructure

### Benefits
1. Confidence in refactoring CLI code
2. Documentation through tests showing all config options work
3. Early detection of regressions
4. Verification that examples in documentation actually work
5. Platform compatibility assurance
