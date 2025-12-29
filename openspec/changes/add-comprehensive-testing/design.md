## Context

The `nest-hex` library provides base classes and decorators for building pluggable adapters in NestJS using the Ports & Adapters pattern. Testing this library requires a comprehensive strategy that covers:

1. **Unit Testing**: Core classes, decorators, and helpers in isolation
2. **Integration Testing**: Full NestJS DI container setup with adapters and port modules
3. **Mock Patterns**: Reusable testing utilities for library consumers

The testing strategy must align with:
- **Bun test** as the test runner (built-in, fast)
- **NestJS Testing Module** for integration tests (`@nestjs/testing`)
- **Reflect-metadata** for decorator testing
- **TypeScript strict mode** for type safety verification

## Goals / Non-Goals

**Goals:**
- Achieve >80% code coverage for all core library components
- Test decorator metadata storage and retrieval
- Verify adapter registration (both sync and async)
- Ensure port token injection works correctly
- Provide mock adapter examples for consumers
- Fast test execution (Bun test advantage)

**Non-Goals:**
- Testing example adapters (S3, HTTP) in detail (those are examples, not library code)
- Performance/load testing (library is thin wrapper)
- E2E testing of consumer applications (out of scope)

## Decisions

### Decision 1: Use Bun Test + NestJS Testing Module

**What:** Combine Bun's built-in test runner with NestJS's `Test.createTestingModule()` for integration tests.

**Why:**
- Bun test is already configured and fast
- NestJS testing utilities are essential for testing DI container behavior
- No need for Jest when Bun provides compatible mocking

**Implementation:**
```typescript
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('Adapter.register()', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestAdapter.register({ option: 'value' })],
    }).compile();
  });

  it('should provide the port token', () => {
    const instance = module.get(TEST_TOKEN);
    expect(instance).toBeDefined();
  });
});
```

### Decision 2: Test Decorator Metadata with reflect-metadata

**What:** Directly test that decorators store and retrieve metadata correctly.

**Why:**
- Decorators are core to the library's DX
- Metadata storage/retrieval must be reliable
- TypeScript doesn't enforce decorator behavior at compile time

**Implementation:**
```typescript
import 'reflect-metadata';
import { Port } from 'nest-hex';
import { PORT_TOKEN_METADATA, PORT_IMPLEMENTATION_METADATA } from '../constants';

describe('@Port decorator', () => {
  it('should store token metadata', () => {
    @Port({ token: TEST_TOKEN, implementation: TestImpl })
    class TestAdapter {}

    const token = Reflect.getMetadata(PORT_TOKEN_METADATA, TestAdapter);
    expect(token).toBe(TEST_TOKEN);
  });
});
```

### Decision 3: Create Reusable Test Fixtures

**What:** Provide shared test utilities in `tests/fixtures/`:
- Mock tokens (`TEST_TOKEN`)
- Mock port interfaces (`TestPort`)
- Mock implementations (`MockTestService`)
- Mock adapters (`MockTestAdapter`)

**Why:**
- Reduce boilerplate in individual tests
- Ensure consistency across test suites
- Provide examples for library consumers

**Structure:**
```
tests/
├── fixtures/
│   ├── test-tokens.ts      # Export mock tokens
│   ├── test-ports.ts       # Export mock port interfaces
│   ├── test-services.ts    # Export mock implementations
│   └── test-adapters.ts    # Export mock adapter modules
├── unit/
│   ├── adapter.test.ts
│   ├── port-module.test.ts
│   ├── decorators.test.ts
│   └── define-adapter.test.ts
└── integration/
    ├── adapter-registration.test.ts
    ├── port-injection.test.ts
    └── mock-patterns.test.ts
```

### Decision 4: Test Both Sync and Async Adapter Registration

**What:** Separate test suites for `register()` and `registerAsync()`.

**Why:**
- Different code paths in the `Adapter` base class
- Async registration uses factory providers with DI
- Both patterns must be verified independently

**Implementation:**
```typescript
describe('Adapter.registerAsync()', () => {
  it('should resolve options from factory', async () => {
    const module = await Test.createTestingModule({
      imports: [
        TestAdapter.registerAsync({
          useFactory: () => ({ option: 'async-value' }),
        }),
      ],
    }).compile();

    // Verify the adapter was configured with factory-resolved options
  });
});
```

### Decision 5: Test Error Cases

**What:** Test that missing `@Port` decorator throws clear errors.

**Why:**
- Developer experience: errors should guide users to correct usage
- Prevents runtime surprises

**Implementation:**
```typescript
describe('Adapter without @Port decorator', () => {
  it('should throw error on register()', () => {
    class InvalidAdapter extends Adapter<void> {}

    expect(() => InvalidAdapter.register(undefined)).toThrow(
      /must be decorated with @Port/
    );
  });
});
```

## Risks / Trade-offs

### Risk: Bun test compatibility with NestJS testing utilities
**Mitigation:** NestJS testing module is framework-agnostic. Verified compatibility in initial setup phase.

### Risk: Metadata reflection issues in test environment
**Mitigation:** Ensure `reflect-metadata` is imported before any decorator tests. Add explicit import in test setup.

### Trade-off: Coverage vs. Maintenance
**Acceptance:** Aim for >80% coverage on core library code, but don't test trivial getters/setters. Focus on business logic and DI integration.

## Migration Plan

Not applicable - this is new testing infrastructure, no migration needed.

## Open Questions

None at this time.
