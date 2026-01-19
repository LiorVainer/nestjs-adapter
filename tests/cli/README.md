# CLI Generator Tests

This directory contains comprehensive tests for the CLI code generators.

## Directory Structure

```
tests/cli/
├── README.md                    # This file
├── helpers/                     # Test utilities and helpers
│   ├── index.ts                 # Barrel export
│   ├── temp-dir.helper.ts       # Temporary directory management
│   ├── file-compare.helper.ts   # File comparison utilities
│   ├── config-builder.helper.ts # Test configuration builder
│   └── generator-runner.helper.ts # Generator execution helpers
├── config/                      # Configuration system tests
│   └── config-loader.test.ts    # Config loading and validation
├── generators/                  # Individual generator tests
│   ├── port-generator.test.ts   # Port generation tests
│   ├── adapter-generator.test.ts # Adapter generation tests
│   └── service-generator.test.ts # Service generation tests
├── integration/                 # Integration tests
│   └── port-adapter-integration.test.ts # E2E port+adapter workflows
├── templates/                   # Template system tests
│   └── template-system.test.ts  # Template rendering tests
├── cross-platform/              # Cross-platform compatibility tests
│   └── cross-platform.test.ts   # Path handling, Windows/Unix
├── error-handling/              # Error handling tests
│   └── error-handling.test.ts   # Input validation, file errors
├── snapshots/                   # Snapshot tests
│   ├── snapshot.test.ts         # Generator output snapshots
│   └── __snapshots__/           # Bun snapshot files (auto-generated)
└── utilities/                   # Utility function tests
    ├── name-transformer.test.ts # Name case transformations
    ├── path-resolver.test.ts    # Path resolution utilities
    └── file-writer.test.ts      # File writing utilities
```

## Running Tests

### Run All CLI Tests

```bash
bun test tests/cli/
```

### Run Specific Test Suites

```bash
# Configuration tests
bun test tests/cli/config/

# Generator tests
bun test tests/cli/generators/

# Integration tests
bun test tests/cli/integration/

# Template tests
bun test tests/cli/templates/

# Cross-platform tests
bun test tests/cli/cross-platform/

# Error handling tests
bun test tests/cli/error-handling/

# Snapshot tests
bun test tests/cli/snapshots/
```

### Run with Watch Mode

```bash
bun test tests/cli/ --watch
```

### Update Snapshots

```bash
bun test tests/cli/snapshots/ --update-snapshots
```

## Test Categories

### 1. Configuration System Tests

Tests for the configuration loading and validation system:

- Loading `nest-hex.config.ts` files
- Fallback to defaults when config is missing
- Deep merge of partial configurations
- Validation of config values (fileCase, indent, quotes, etc.)
- Cross-platform path handling in config

### 2. Generator Tests

Individual tests for each generator:

**Port Generator:**
- Token, interface, service, and module generation
- File naming based on config
- Optional file generation (module, service)
- Style configuration application

**Adapter Generator:**
- Adapter class generation with @Adapter decorator
- Service implementation generation
- Types file generation
- Port integration (imports, implements)

**Service Generator:**
- Injectable service generation
- Port injection with @InjectPort
- Custom import path handling

### 3. Integration Tests

End-to-end tests for complete workflows:

- Full port generation pipeline
- Full adapter generation pipeline
- Port + Adapter together (generate port, then adapter for that port)
- Configuration variations across generations

### 4. Template System Tests

Tests for the Handlebars template rendering:

- Individual template rendering (token.hbs, interface.hbs, etc.)
- Conditional rendering ({{#if}})
- Context variable availability
- Custom template overrides
- Template error handling

### 5. Cross-Platform Tests

Tests for Windows and Unix compatibility:

- Path normalization (backslashes → forward slashes)
- Import path generation
- Deep nested path handling
- Mixed slash handling

### 6. Error Handling Tests

Tests for graceful error handling:

- Input validation errors
- File system errors (conflicts, permissions)
- Template errors (missing files, syntax errors)
- Recovery from partial failures

### 7. Snapshot Tests

Capture expected generator output:

- Default generation snapshots
- Custom configuration snapshots
- File case variation snapshots
- Style variation snapshots

## Test Helpers

### `createTempDir()`

Creates isolated temporary directories for tests:

```typescript
import { createTempDir } from './helpers'

describe('My Test', () => {
  const tempDir = createTempDir()
  let testDir: string

  beforeEach(async () => {
    testDir = await tempDir.create()
  })

  afterEach(async () => {
    await tempDir.cleanupAll()
  })

  test('example', async () => {
    // Use testDir as isolated test directory
  })
})
```

### `configBuilder()`

Fluent builder for test configurations:

```typescript
import { configBuilder } from './helpers'

const config = configBuilder()
  .withFileCase('pascal')
  .withIndent(2)
  .withQuotes('double')
  .withSemicolons(false)
  .withPortSuffix('CONTRACT')
  .build()
```

### `testConfigs`

Predefined test configurations:

```typescript
import { testConfigs } from './helpers'

testConfigs.minimal()        // All defaults
testConfigs.contractNaming() // CONTRACT suffix
testConfigs.pascalCase()     // PascalCase files
testConfigs.prettier()       // Prettier-style (2-space, double quotes)
testConfigs.biome()          // Biome-style (tabs, single quotes)
testConfigs.fullyCustom()    // All options customized
```

## Adding New Tests

### 1. Create Test File

Create a new test file in the appropriate directory:

```typescript
import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { createTempDir, configBuilder } from '../helpers'

describe('My Feature Tests', () => {
  const tempDir = createTempDir()
  let testDir: string

  beforeEach(async () => {
    testDir = await tempDir.create()
  })

  afterEach(async () => {
    await tempDir.cleanupAll()
  })

  test('should do something', async () => {
    // Arrange
    const config = configBuilder().build()

    // Act
    // ... perform action

    // Assert
    expect(result).toBe(expected)
  })
})
```

### 2. Follow Naming Conventions

- Test files: `*.test.ts`
- Test names: Descriptive, action-oriented ("should generate token file")
- Section references: Include task ID when applicable ("8.1.1 - token.hbs renders...")

### 3. Use AAA Pattern

Structure tests with Arrange-Act-Assert:

```typescript
test('should generate port files', async () => {
  // Arrange - Set up test data and dependencies
  const config = configBuilder().build()
  const generator = new PortGenerator(config)

  // Act - Perform the action being tested
  const result = await generator.generate({
    name: 'test-port',
    outputPath: testDir,
  })

  // Assert - Verify the expected outcome
  expect(result.success).toBe(true)
})
```

## Test Coverage Goals

- **Generators**: >80% code coverage
- **Utilities**: >90% code coverage
- **Templates**: All templates have rendering tests

## CI/CD Integration

These tests run automatically on:

- Pull request creation/update
- Push to main branch
- Release preparation

The test suite is configured to fail fast and report all failures for quick debugging.
