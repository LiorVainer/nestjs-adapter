## 1. Setup Testing Infrastructure

- [x] 1.1 Install `@nestjs/testing` as dev dependency
- [x] 1.2 Configure Bun test for coverage reporting
- [x] 1.3 Create test utilities directory structure (`tests/utils/`, `tests/fixtures/`)
- [x] 1.4 Set up test fixtures (mock tokens, ports, implementations)

## 2. Unit Tests - Core Components

- [x] 2.1 Write unit tests for `Adapter.register()` method
- [x] 2.2 Write unit tests for `Adapter.registerAsync()` method
- [x] 2.3 Write unit tests for `PortModule.register()` method
- [x] 2.4 Write unit tests for `@Port` decorator metadata storage
- [x] 2.5 Write unit tests for `@InjectPort` decorator parameter injection
- [x] 2.6 Write unit tests for `defineAdapter()` helper type constraints

## 3. Integration Tests - Adapter Registration

- [x] 3.1 Test adapter module creation with `register()`
- [x] 3.2 Test adapter module creation with `registerAsync()`
- [x] 3.3 Test port token injection in domain services
- [x] 3.4 Test `useExisting` aliasing from token to implementation
- [x] 3.5 Test adapter exports (ensure only token is exported)
- [x] 3.6 Test error handling when `@Port` decorator is missing

## 4. Integration Tests - Port Modules

- [x] 4.1 Test port module accepts adapter and imports it
- [x] 4.2 Test port module exposes domain service
- [x] 4.3 Test port module works with mock adapters

## 5. Mock Adapter Patterns

- [x] 5.1 Create example mock adapter for testing
- [x] 5.2 Document mock adapter creation patterns
- [x] 5.3 Test `.overrideProvider()` pattern with NestJS testing module

## 6. Coverage and Documentation

- [x] 6.1 Achieve >80% code coverage for core components (achieved 96.15%)
- [x] 6.2 Generate coverage report
- [x] 6.3 Add testing documentation to project README or docs (created TESTING.md)
- [x] 6.4 Update CLAUDE.md with testing patterns and examples

## 7. CI Integration

- [x] 7.1 Verify tests run in pre-commit hooks
- [x] 7.2 Ensure `bun run lint && bun run type-check` includes test files
- [x] 7.3 Verify test script runs successfully: `bun test`
