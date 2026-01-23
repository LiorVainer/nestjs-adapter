# CLI Generator Test Examples

This document provides example test code demonstrating the testing approach for the CLI generators.

## Table of Contents
1. [Test Infrastructure](#test-infrastructure)
2. [Configuration Testing](#configuration-testing)
3. [Generator Output Testing](#generator-output-testing)
4. [Integration Testing](#integration-testing)
5. [Utility Function Testing](#utility-function-testing)

---

## Test Infrastructure

### Temporary Directory Helper

```typescript
// tests/cli/helpers/temp-dir.helper.ts
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export function createTempDir() {
  const dirs: string[] = []

  return {
    async create(): Promise<string> {
      const dir = join(tmpdir(), `nest-hex-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      await mkdir(dir, { recursive: true })
      dirs.push(dir)
      return dir
    },

    async cleanupAll(): Promise<void> {
      await Promise.all(dirs.map(dir => rm(dir, { recursive: true, force: true })))
      dirs.length = 0
    },
  }
}
```

### Config Builder Helper

```typescript
// tests/cli/helpers/config-builder.helper.ts
import type { NestHexConfig } from '../../../src/cli/types'

export class ConfigBuilder {
  private config: Partial<NestHexConfig> = {}

  withPortsDir(dir: string): this {
    if (!this.config.output) this.config.output = {}
    this.config.output.portsDir = dir
    return this
  }

  withFileCase(fileCase: 'kebab' | 'camel' | 'pascal'): this {
    if (!this.config.naming) this.config.naming = {}
    this.config.naming.fileCase = fileCase
    return this
  }

  withIndent(indent: 'tab' | 2 | 4): this {
    if (!this.config.style) this.config.style = {}
    this.config.style.indent = indent
    return this
  }

  build(): NestHexConfig {
    // Merge with defaults
    return {
      output: {
        portsDir: 'src/ports',
        adaptersDir: 'src/adapters',
        ...this.config.output,
      },
      naming: {
        portSuffix: 'PORT',
        adapterSuffix: 'Adapter',
        fileCase: 'kebab',
        ...this.config.naming,
      },
      style: {
        indent: 'tab',
        quotes: 'single',
        semicolons: true,
        ...this.config.style,
      },
      templates: this.config.templates || {},
    }
  }
}

export function configBuilder(): ConfigBuilder {
  return new ConfigBuilder()
}
```

---

## Configuration Testing

Testing that all nest-hex.config.ts configuration options work correctly.

```typescript
// tests/cli/config/config-options.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { configBuilder, createTempDir } from '../helpers'
import type { NestHexConfig } from '../../../src/cli/types'

describe('Configuration Options Integration', () => {
  const tempDir = createTempDir()
  let testDir: string

  beforeEach(async () => {
    testDir = await tempDir.create()
  })

  afterEach(async () => {
    await tempDir.cleanupAll()
  })

  describe('output directory configuration', () => {
    test('respects custom portsDir', async () => {
      // Arrange: Configure custom ports directory
      const config = configBuilder()
        .withPortsDir('custom/domain/ports')
        .build()

      const generator = new PortGenerator(config)

      // Act: Generate port
      await generator.generate({
        name: 'object-storage',
        outputPath: testDir,
      })

      // Assert: Files created in custom directory structure
      const expectedDir = join(testDir, 'custom/domain/ports/object-storage')
      const tokenFile = Bun.file(join(expectedDir, 'object-storage.token.ts'))
      expect(await tokenFile.exists()).toBe(true)
    })
  })

  describe('naming convention configuration', () => {
    test('applies custom portSuffix to token names', async () => {
      // Arrange: Configure custom port suffix
      const config = configBuilder()
        .withPortSuffix('CONTRACT')
        .build()

      const generator = new PortGenerator(config)

      // Act: Generate port
      await generator.generate({
        name: 'object-storage',
        outputPath: join(testDir, 'src/ports'),
      })

      // Assert: Token uses CONTRACT suffix, not PORT
      const tokenFile = join(testDir, 'src/ports/object-storage/object-storage.token.ts')
      const content = await Bun.file(tokenFile).text()

      expect(content).toContain("export const OBJECT_STORAGE_CONTRACT = Symbol('OBJECT_STORAGE_CONTRACT')")
      expect(content).not.toContain('OBJECT_STORAGE_PORT')
    })

    test('applies fileCase=pascal to all generated files', async () => {
      // Arrange
      const config = configBuilder()
        .withFileCase('pascal')
        .build()

      const generator = new PortGenerator(config)

      // Act
      await generator.generate({
        name: 'object-storage',
        outputPath: join(testDir, 'src/ports'),
      })

      // Assert: All files use PascalCase
      const baseDir = join(testDir, 'src/ports/ObjectStorage')
      const expectedFiles = [
        'ObjectStorage.token.ts',
        'ObjectStorage.port.ts',
        'ObjectStorage.service.ts',
        'ObjectStorage.module.ts',
      ]

      for (const filename of expectedFiles) {
        const file = Bun.file(join(baseDir, filename))
        expect(await file.exists()).toBe(true)
      }
    })
  })

  describe('code style configuration', () => {
    test('applies indent=2 to generated code', async () => {
      // Arrange
      const config = configBuilder()
        .withIndent(2)
        .build()

      const generator = new PortGenerator(config)

      // Act
      await generator.generate({
        name: 'object-storage',
        outputPath: join(testDir, 'src/ports'),
      })

      // Assert: Generated code uses 2-space indentation
      const serviceFile = join(testDir, 'src/ports/object-storage/object-storage.service.ts')
      const content = await Bun.file(serviceFile).text()

      // Check for 2-space indentation (no tabs)
      const lines = content.split('\n')
      const indentedLines = lines.filter(line => /^\s+\S/.test(line))

      // Should have some indented lines
      expect(indentedLines.length).toBeGreaterThan(0)

      // Should not contain tabs
      expect(content).not.toContain('\t')

      // Should contain 2-space indents
      const twoSpaceLines = indentedLines.filter(line => /^  [^\s]/.test(line))
      expect(twoSpaceLines.length).toBeGreaterThan(0)
    })
  })
})
```

---

## Generator Output Testing

Testing that generators produce correct and complete output.

```typescript
// tests/cli/generators/port-generator.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { createTempDir, configBuilder } from '../helpers'

describe('PortGenerator Output Validation', () => {
  const tempDir = createTempDir()
  let testDir: string

  beforeEach(async () => {
    testDir = await tempDir.create()
  })

  afterEach(async () => {
    await tempDir.cleanupAll()
  })

  describe('complete port module generation', () => {
    test('generates all 5 files with correct names', async () => {
      // Arrange
      const config = configBuilder().build()
      const generator = new PortGenerator(config)

      // Act
      await generator.generate({
        name: 'object-storage',
        outputPath: join(testDir, 'src/ports'),
        includeModule: true,
        includeService: true,
      })

      // Assert: All files exist
      const baseDir = join(testDir, 'src/ports/object-storage')
      const expectedFiles = [
        'object-storage.token.ts',
        'object-storage.port.ts',
        'object-storage.service.ts',
        'object-storage.module.ts',
        'index.ts',
      ]

      for (const filename of expectedFiles) {
        const file = Bun.file(join(baseDir, filename))
        const exists = await file.exists()
        expect(exists).toBe(true)
        if (!exists) {
          console.error(`Missing file: ${filename}`)
        }
      }
    })

    test('token file uses PORT suffix', async () => {
      // Arrange
      const config = configBuilder().build()
      const generator = new PortGenerator(config)

      // Act
      await generator.generate({
        name: 'object-storage',
        outputPath: join(testDir, 'src/ports'),
      })

      // Assert: Token uses PORT suffix, not PROVIDER
      const tokenFile = join(testDir, 'src/ports/object-storage/object-storage.token.ts')
      const content = await Bun.file(tokenFile).text()

      expect(content).toContain('OBJECT_STORAGE_PORT')
      expect(content).toContain("Symbol('OBJECT_STORAGE_PORT')")
      expect(content).not.toContain('PROVIDER')

      // Verify export structure
      expect(content).toContain('export const OBJECT_STORAGE_PORT')
      expect(content).toContain('export type ObjectStorageToken = typeof OBJECT_STORAGE_PORT')
    })

    test('service file uses @InjectPort decorator', async () => {
      // Arrange
      const config = configBuilder().build()
      const generator = new PortGenerator(config)

      // Act
      await generator.generate({
        name: 'object-storage',
        outputPath: join(testDir, 'src/ports'),
        includeService: true,
      })

      // Assert: Service uses correct decorator and injection
      const serviceFile = join(testDir, 'src/ports/object-storage/object-storage.service.ts')
      const content = await Bun.file(serviceFile).text()

      expect(content).toContain("import { InjectPort } from 'nest-hex'")
      expect(content).toContain("import { OBJECT_STORAGE_PORT } from './object-storage.token'")
      expect(content).toContain('@InjectPort(OBJECT_STORAGE_PORT)')
      expect(content).toContain('export class ObjectStorageService')
    })
  })

  describe('component inclusion options', () => {
    test('includeModule=false skips module generation', async () => {
      // Arrange
      const config = configBuilder().build()
      const generator = new PortGenerator(config)

      // Act
      await generator.generate({
        name: 'object-storage',
        outputPath: join(testDir, 'src/ports'),
        includeModule: false,
        includeService: true,
      })

      // Assert: Module file not created
      const baseDir = join(testDir, 'src/ports/object-storage')
      const moduleFile = Bun.file(join(baseDir, 'object-storage.module.ts'))
      expect(await moduleFile.exists()).toBe(false)

      // Assert: Index doesn't export module
      const indexFile = join(baseDir, 'index.ts')
      const content = await Bun.file(indexFile).text()
      expect(content).not.toContain("export * from './object-storage.module'")
    })
  })

  describe('edge cases', () => {
    test('creates non-existent parent directories', async () => {
      // Arrange
      const deepPath = join(testDir, 'deep/nested/structure/src/ports')
      const config = configBuilder().build()
      const generator = new PortGenerator(config)

      // Act
      await generator.generate({
        name: 'object-storage',
        outputPath: deepPath,
      })

      // Assert: Files exist in deep path
      const tokenFile = Bun.file(join(deepPath, 'object-storage/object-storage.token.ts'))
      expect(await tokenFile.exists()).toBe(true)
    })

    test('handles port name with hyphens', async () => {
      // Arrange
      const config = configBuilder().build()
      const generator = new PortGenerator(config)

      // Act
      await generator.generate({
        name: 'object-storage-provider',
        outputPath: join(testDir, 'src/ports'),
      })

      // Assert: Files use kebab-case, classes use PascalCase, tokens use SCREAMING_SNAKE_CASE
      const baseDir = join(testDir, 'src/ports/object-storage-provider')

      // File names
      const tokenFile = Bun.file(join(baseDir, 'object-storage-provider.token.ts'))
      expect(await tokenFile.exists()).toBe(true)

      // Token name
      const tokenContent = await tokenFile.text()
      expect(tokenContent).toContain('OBJECT_STORAGE_PROVIDER_PORT')

      // Interface name
      const interfaceFile = join(baseDir, 'object-storage-provider.port.ts')
      const interfaceContent = await Bun.file(interfaceFile).text()
      expect(interfaceContent).toContain('export interface ObjectStorageProviderPort')
    })
  })
})
```

---

## Integration Testing

Testing that ports and adapters work together correctly.

```typescript
// tests/cli/integration/port-adapter-integration.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { createTempDir, configBuilder } from '../helpers'

describe('Port + Adapter Integration', () => {
  const tempDir = createTempDir()
  let testDir: string

  beforeEach(async () => {
    testDir = await tempDir.create()
  })

  afterEach(async () => {
    await tempDir.cleanupAll()
  })

  test('generates port then adapter that correctly references it', async () => {
    // Arrange
    const config = configBuilder().build()

    // Step 1: Generate port
    const portGenerator = new PortGenerator(config)
    await portGenerator.generate({
      name: 'object-storage',
      outputPath: join(testDir, 'src/ports'),
      includeModule: true,
      includeService: true,
    })

    // Step 2: Generate adapter that references the port
    const adapterGenerator = new AdapterGenerator(config)
    await adapterGenerator.generate({
      name: 's3',
      outputPath: join(testDir, 'src/adapters'),
      portName: 'object-storage',
      portPath: '../../ports/object-storage',
      technology: 'AWS S3',
    })

    // Step 3: Verify adapter imports port token correctly
    const adapterFile = join(testDir, 'src/adapters/s3/s3.adapter.ts')
    const adapterContent = await Bun.file(adapterFile).text()

    // Assert: Adapter imports the port token
    expect(adapterContent).toContain("import { OBJECT_STORAGE_PORT } from '../../ports/object-storage'")
    // Assert: Adapter references port token in @Adapter decorator
    expect(adapterContent).toContain('portToken: OBJECT_STORAGE_PORT')
    // Assert: Adapter extends AdapterBase
    expect(adapterContent).toContain('export class S3Adapter extends AdapterBase')

    // Step 4: Verify adapter service implements port interface
    const serviceFile = join(testDir, 'src/adapters/s3/s3.service.ts')
    const serviceContent = await Bun.file(serviceFile).text()

    // Assert: Service imports and implements port interface
    expect(serviceContent).toContain("import type { ObjectStoragePort } from '../../ports/object-storage'")
    expect(serviceContent).toContain('export class S3Service implements ObjectStoragePort')
  })

  test('import paths use forward slashes on all platforms', async () => {
    // This test ensures cross-platform compatibility
    const config = configBuilder().build()

    const portGenerator = new PortGenerator(config)
    await portGenerator.generate({
      name: 'object-storage',
      outputPath: join(testDir, 'src/ports'),
    })

    const adapterGenerator = new AdapterGenerator(config)
    await adapterGenerator.generate({
      name: 's3',
      outputPath: join(testDir, 'src/adapters'),
      portName: 'object-storage',
    })

    const adapterFile = join(testDir, 'src/adapters/s3/s3.adapter.ts')
    const content = await Bun.file(adapterFile).text()

    // Assert: No backslashes in import statements
    const importLines = content.split('\n').filter(line => line.includes('import'))
    for (const line of importLines) {
      expect(line).not.toContain('\\\\')
    }
  })
})
```

---

## Utility Function Testing

Unit tests for utility functions like name transformers.

```typescript
// tests/cli/utils/name-transformer.test.ts
import { describe, expect, test } from 'bun:test'
import {
  toKebabCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toScreamingSnakeCase,
  generateNameVariations,
} from '../../../src/cli/utils/name-transformer'

describe('Name Transformer Utilities', () => {
  describe('toKebabCase', () => {
    test('converts PascalCase to kebab-case', () => {
      expect(toKebabCase('ObjectStorage')).toBe('object-storage')
      expect(toKebabCase('UserAuth')).toBe('user-auth')
      expect(toKebabCase('HTTPClient')).toBe('http-client')
    })

    test('converts camelCase to kebab-case', () => {
      expect(toKebabCase('objectStorage')).toBe('object-storage')
      expect(toKebabCase('userAuth')).toBe('user-auth')
    })

    test('preserves existing kebab-case', () => {
      expect(toKebabCase('object-storage')).toBe('object-storage')
      expect(toKebabCase('user-auth')).toBe('user-auth')
    })

    test('handles single words', () => {
      expect(toKebabCase('storage')).toBe('storage')
      expect(toKebabCase('Storage')).toBe('storage')
    })
  })

  describe('generateNameVariations', () => {
    test('generates all 6 name variations from kebab-case input', () => {
      const result = generateNameVariations('object-storage')

      expect(result).toEqual({
        kebab: 'object-storage',
        camel: 'objectStorage',
        pascal: 'ObjectStorage',
        snake: 'object_storage',
        screamingSnake: 'OBJECT_STORAGE',
        original: 'object-storage',
      })
    })

    test('generates all variations from PascalCase input', () => {
      const result = generateNameVariations('ObjectStorage')

      expect(result).toEqual({
        kebab: 'object-storage',
        camel: 'objectStorage',
        pascal: 'ObjectStorage',
        snake: 'object_storage',
        screamingSnake: 'OBJECT_STORAGE',
        original: 'ObjectStorage',
      })
    })
  })

  describe('edge cases', () => {
    test('handles empty string', () => {
      expect(toKebabCase('')).toBe('')
      expect(toCamelCase('')).toBe('')
      expect(toPascalCase('')).toBe('')
    })

    test('handles names with numbers', () => {
      const result = generateNameVariations('s3-storage-v2')

      expect(result.kebab).toBe('s3-storage-v2')
      expect(result.camel).toBe('s3StorageV2')
      expect(result.pascal).toBe('S3StorageV2')
      expect(result.screamingSnake).toBe('S3_STORAGE_V2')
    })
  })
})
```

---

## Key Patterns

### 1. API Usage Pattern

```typescript
// Correct API usage:
const config: NestHexConfig = configBuilder().withFileCase('pascal').build()
const generator = new PortGenerator(config)  // Config to constructor

await generator.generate({  // Options to generate()
  name: 'object-storage',
  outputPath: testDir,
  includeModule: true,
})
```

### 2. Temp Directory Pattern

```typescript
describe('test suite', () => {
  const tempDir = createTempDir()
  let testDir: string

  beforeEach(async () => {
    testDir = await tempDir.create()  // Creates isolated directory
  })

  afterEach(async () => {
    await tempDir.cleanupAll()  // Cleans up automatically
  })
})
```

### 3. File Verification Pattern

```typescript
// Check if file exists
const file = Bun.file(filePath)
expect(await file.exists()).toBe(true)

// Check file content
const content = await Bun.file(filePath).text()
expect(content).toContain('expected string')
```

### 4. Configuration Builder Pattern

```typescript
const config = configBuilder()
  .withPortsDir('custom/ports')
  .withFileCase('pascal')
  .withIndent(2)
  .build()
```

---

## Next Steps

When implementing these tests:

1. **Start with helpers** - Implement temp-dir, config-builder, and file-compare helpers first
2. **Utility tests next** - Test name-transformer and path-resolver utilities
3. **Generator tests** - Test PortGenerator, then AdapterGenerator, then ServiceGenerator
4. **Integration tests last** - Test generators working together
5. **Run tests frequently** - Use `bun test --watch` during development

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/cli/generators/port-generator.test.ts

# Run with coverage
bun test --coverage

# Run in watch mode
bun test --watch
```
