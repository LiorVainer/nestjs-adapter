# Change: Add Comprehensive Testing Infrastructure

## Why

The library currently lacks a comprehensive testing infrastructure. To ensure reliability, maintainability, and developer confidence, we need to establish:
- Unit tests for all core components (Adapter, PortModule, decorators, helpers)
- Integration tests for adapter registration and port token injection
- Mock adapter patterns for testing consumer applications
- Type safety verification tests

This is a foundational requirement before the library can be considered production-ready.

## What Changes

- Add complete test suite using Bun test and NestJS testing utilities
- Implement unit tests for:
  - `Adapter` base class (register/registerAsync)
  - `PortModule` base class
  - `@Port` and `@InjectPort` decorators
  - `defineAdapter()` helper
- Add integration tests for:
  - End-to-end adapter registration and DI resolution
  - Token aliasing and provider exports
  - Mock adapter patterns
- Add test fixtures and utilities for common testing scenarios
- Configure test coverage reporting
- Document testing patterns and best practices

## Impact

- **Affected specs**: Creates new `testing` capability
- **Affected code**:
  - `src/core/adapter.base.ts` - Needs comprehensive unit tests
  - `src/core/port-module.base.ts` - Needs unit tests
  - `src/core/decorators.ts` - Needs decorator behavior tests
  - `src/core/define-adapter.ts` - Needs type safety verification
  - New test files in `__tests__/` or similar directory
- **Dependencies**: Requires `@nestjs/testing` as dev dependency
- **CI/CD**: Pre-commit hooks already configured to run tests
