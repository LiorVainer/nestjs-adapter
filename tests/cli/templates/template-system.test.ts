import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { mkdir, writeFile as fsWriteFile } from 'node:fs/promises'
import { renderTemplate, renderTemplateString } from '../../../src/cli/utils/template-renderer'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { configBuilder, createTempDir } from '../helpers'

/**
 * Template System Tests
 *
 * These tests verify:
 * - Individual templates render correctly with context
 * - Conditional rendering works as expected
 * - Error handling for missing/invalid templates
 * - Custom template overrides work correctly
 *
 * @see openspec/changes/add-cli-generator-tests/tasks.md Section 8
 */
describe('Template System Tests', () => {
	const tempDir = createTempDir()
	let testDir: string

	// Get path to actual templates
	const templatesRoot = join(__dirname, '../../../src/cli/templates')

	beforeEach(async () => {
		testDir = await tempDir.create()
	})

	afterEach(async () => {
		await tempDir.cleanupAll()
	})

	/**
	 * Helper to create a complete template context for testing
	 */
	function createTestContext(overrides: Record<string, unknown> = {}): Record<string, unknown> {
		return {
			// Name variations
			original: 'object-storage',
			kebab: 'object-storage',
			camel: 'objectStorage',
			pascal: 'ObjectStorage',
			snake: 'object_storage',
			screamingSnake: 'OBJECT_STORAGE',
			nameKebab: 'object-storage',
			nameCamel: 'objectStorage',
			namePascal: 'ObjectStorage',
			nameSnake: 'object_storage',
			nameScreamingSnake: 'OBJECT_STORAGE',
			fileName: 'object-storage',
			portSuffix: 'PORT',
			adapterSuffix: 'Adapter',
			fileCase: 'kebab',
			indent: 'tab',
			quotes: 'single',
			semicolons: true,
			includeModule: true,
			includeService: true,
			registrationType: 'sync',
			generateExample: false,
			coreImportPath: 'nest-hex',
			...overrides,
		}
	}

	/**
	 * Section 8.1: Port Template Tests
	 */
	describe('Port Template Tests', () => {
		const baseContext = createTestContext()

		test('8.1.1 - token.hbs renders with correct context', async () => {
			// Act
			const result = await renderTemplate(
				join(templatesRoot, 'port/token.hbs'),
				baseContext,
			)

			// Assert
			expect(result).toContain('export const OBJECT_STORAGE_PORT')
			expect(result).toContain("Symbol('OBJECT_STORAGE_PORT')")
			expect(result).toContain('export type ObjectStorageToken')
			expect(result).toContain('typeof OBJECT_STORAGE_PORT')
		})

		test('8.1.2 - interface.hbs renders with correct context', async () => {
			// Act
			const result = await renderTemplate(
				join(templatesRoot, 'port/interface.hbs'),
				baseContext,
			)

			// Assert
			expect(result).toContain('export interface ObjectStoragePort')
			expect(result).toContain('getObjectStorage')
			expect(result).toContain('createObjectStorage')
		})

		test('8.1.3 - service.hbs renders with correct context', async () => {
			// Act
			const result = await renderTemplate(
				join(templatesRoot, 'port/service.hbs'),
				baseContext,
			)

			// Assert
			expect(result).toContain("import { Injectable } from '@nestjs/common'")
			expect(result).toContain("import { InjectPort } from 'nest-hex'")
			expect(result).toContain('import type { ObjectStoragePort }')
			expect(result).toContain('OBJECT_STORAGE_PORT')
			expect(result).toContain('@Injectable()')
			expect(result).toContain('export class ObjectStorageService')
			expect(result).toContain('@InjectPort(OBJECT_STORAGE_PORT)')
			expect(result).toContain('private readonly objectStorage: ObjectStoragePort')
		})

		test('8.1.4 - module.hbs renders with correct context', async () => {
			// Act
			const result = await renderTemplate(
				join(templatesRoot, 'port/module.hbs'),
				baseContext,
			)

			// Assert
			expect(result).toContain("import { Module } from '@nestjs/common'")
			expect(result).toContain("import { DomainModule } from 'nest-hex'")
			expect(result).toContain('@Module({})')
			expect(result).toContain('export class ObjectStorageModule extends DomainModule')
		})

		test('8.1.5 - index.hbs renders with conditional exports', async () => {
			// Test with both flags true
			const resultWithAll = await renderTemplate(
				join(templatesRoot, 'port/index.hbs'),
				{ ...baseContext, includeService: true, includeModule: true },
			)

			expect(resultWithAll).toContain("export * from './object-storage.port'")
			expect(resultWithAll).toContain("export * from './object-storage.token'")
			expect(resultWithAll).toContain("export * from './object-storage.service'")
			expect(resultWithAll).toContain("export * from './object-storage.module'")

			// Test with service only
			const resultServiceOnly = await renderTemplate(
				join(templatesRoot, 'port/index.hbs'),
				{ ...baseContext, includeService: true, includeModule: false },
			)

			expect(resultServiceOnly).toContain("export * from './object-storage.service'")
			expect(resultServiceOnly).not.toContain("export * from './object-storage.module'")

			// Test with neither
			const resultMinimal = await renderTemplate(
				join(templatesRoot, 'port/index.hbs'),
				{ ...baseContext, includeService: false, includeModule: false },
			)

			expect(resultMinimal).toContain("export * from './object-storage.port'")
			expect(resultMinimal).toContain("export * from './object-storage.token'")
			expect(resultMinimal).not.toContain("export * from './object-storage.service'")
			expect(resultMinimal).not.toContain("export * from './object-storage.module'")
		})

		test('token template uses custom portSuffix', async () => {
			// Arrange: Custom suffix
			const customContext = { ...baseContext, portSuffix: 'CONTRACT' }

			// Act
			const result = await renderTemplate(
				join(templatesRoot, 'port/token.hbs'),
				customContext,
			)

			// Assert
			expect(result).toContain('OBJECT_STORAGE_CONTRACT')
			expect(result).not.toContain('OBJECT_STORAGE_PORT')
		})
	})

	/**
	 * Section 8.2: Adapter Template Tests
	 */
	describe('Adapter Template Tests', () => {
		const baseContext = createTestContext({
			original: 's3-storage',
			kebab: 's3-storage',
			camel: 's3Storage',
			pascal: 'S3Storage',
			snake: 's3_storage',
			screamingSnake: 'S3_STORAGE',
			namePascal: 'S3Storage',
			nameKebab: 's3-storage',
			nameCamel: 's3Storage',
			nameSnake: 's3_storage',
			nameScreamingSnake: 'S3_STORAGE',
			fileName: 's3-storage',
		})

		test('8.2.1 - adapter.hbs renders with correct context', async () => {
			// Test without port reference
			const resultBasic = await renderTemplate(
				join(templatesRoot, 'adapter/adapter.hbs'),
				baseContext,
			)

			expect(resultBasic).toContain("import { Adapter, AdapterBase } from 'nest-hex'")
			expect(resultBasic).toContain('import { S3StorageService }')
			expect(resultBasic).toContain('@Adapter({')
			expect(resultBasic).toContain('portToken: S3_STORAGE_PORT')
			expect(resultBasic).toContain('implementation: S3StorageService')
			expect(resultBasic).toContain('export class S3StorageAdapter extends AdapterBase')

			// Test with port reference
			const contextWithPort = {
				...baseContext,
				portTokenName: 'OBJECT_STORAGE_PORT',
				portImportPath: '../../ports/object-storage',
				portInterfaceName: 'ObjectStoragePort',
				portNamePascal: 'ObjectStorage',
			}

			const resultWithPort = await renderTemplate(
				join(templatesRoot, 'adapter/adapter.hbs'),
				contextWithPort,
			)

			expect(resultWithPort).toContain("import { OBJECT_STORAGE_PORT } from '../../ports/object-storage'")
			expect(resultWithPort).toContain('portToken: OBJECT_STORAGE_PORT')
			expect(resultWithPort).toContain('@Adapter<S3StorageAdapterConfig>')
		})

		test('8.2.2 - service.hbs renders with port interface implementation', async () => {
			// Test without port
			const resultBasic = await renderTemplate(
				join(templatesRoot, 'adapter/service.hbs'),
				baseContext,
			)

			expect(resultBasic).toContain("import { Injectable } from '@nestjs/common'")
			expect(resultBasic).toContain('@Injectable()')
			expect(resultBasic).toContain('export class S3StorageService')
			expect(resultBasic).not.toContain('implements')

			// Test with port interface
			const contextWithPort = {
				...baseContext,
				portInterfaceName: 'ObjectStoragePort',
				portImportPath: '../../ports/object-storage',
			}

			const resultWithPort = await renderTemplate(
				join(templatesRoot, 'adapter/service.hbs'),
				contextWithPort,
			)

			expect(resultWithPort).toContain("import type { ObjectStoragePort } from '../../ports/object-storage'")
			expect(resultWithPort).toContain('export class S3StorageService implements ObjectStoragePort')
		})

		test('8.2.3 - types.hbs renders with config options', async () => {
			// Test basic types
			const resultBasic = await renderTemplate(
				join(templatesRoot, 'adapter/types.hbs'),
				baseContext,
			)

			expect(resultBasic).toContain('export interface S3StorageConfigOptions')
			expect(resultBasic).toContain('// Example configuration properties')

			// Test with port reference
			const contextWithPort = {
				...baseContext,
				portTokenName: 'OBJECT_STORAGE_PORT',
				portInterfaceName: 'ObjectStoragePort',
				portImportPath: '../../ports/object-storage',
				portNamePascal: 'ObjectStorage',
			}

			const resultWithPort = await renderTemplate(
				join(templatesRoot, 'adapter/types.hbs'),
				contextWithPort,
			)

			expect(resultWithPort).toContain("import type { AdapterConfig } from 'nest-hex'")
			expect(resultWithPort).toContain("import type { OBJECT_STORAGE_PORT, ObjectStoragePort } from '../../ports/object-storage'")
			expect(resultWithPort).toContain('export type ObjectStorageToken = typeof OBJECT_STORAGE_PORT')
			expect(resultWithPort).toContain('export type S3StorageAdapterConfig = AdapterConfig<ObjectStorageToken, ObjectStoragePort>')
		})

		test('8.2.4 - index.hbs renders with all exports', async () => {
			// Act
			const result = await renderTemplate(
				join(templatesRoot, 'adapter/index.hbs'),
				baseContext,
			)

			// Assert
			expect(result).toContain("export * from './s3-storage.adapter'")
			expect(result).toContain("export * from './s3-storage.service'")
			expect(result).toContain("export * from './s3-storage.types'")
		})

		test('adapter template uses custom adapterSuffix', async () => {
			// Arrange: Custom suffix
			const customContext = { ...baseContext, adapterSuffix: 'Impl' }

			// Act
			const result = await renderTemplate(
				join(templatesRoot, 'adapter/adapter.hbs'),
				customContext,
			)

			// Assert
			expect(result).toContain('export class S3StorageImpl extends AdapterBase')
		})
	})

	/**
	 * Section 8.3: Custom Template Tests
	 */
	describe('Custom Template Tests', () => {
		test('8.3.1 - custom template can override default', async () => {
			// Arrange: Create custom template
			const customTemplateDir = join(testDir, 'custom-templates')
			await mkdir(customTemplateDir, { recursive: true })

			const customTemplate = `// Custom Token Template
export const CUSTOM_{{nameScreamingSnake}}_TOKEN = Symbol('CUSTOM_{{nameScreamingSnake}}_TOKEN')
`
			await fsWriteFile(join(customTemplateDir, 'custom-token.hbs'), customTemplate)

			// Act
			const result = await renderTemplate(
				join(customTemplateDir, 'custom-token.hbs'),
				{
					nameScreamingSnake: 'MY_PORT',
					namePascal: 'MyPort',
				},
			)

			// Assert
			expect(result).toContain('// Custom Token Template')
			expect(result).toContain('CUSTOM_MY_PORT_TOKEN')
		})

		test('8.3.2 - custom template receives correct context', async () => {
			// Arrange: Create template that uses all context variables
			const customTemplateDir = join(testDir, 'custom-templates')
			await mkdir(customTemplateDir, { recursive: true })

			const contextTestTemplate = `pascal: {{namePascal}}
kebab: {{nameKebab}}
camel: {{nameCamel}}
snake: {{nameSnake}}
screaming: {{nameScreamingSnake}}
fileName: {{fileName}}
portSuffix: {{portSuffix}}
adapterSuffix: {{adapterSuffix}}
`
			await fsWriteFile(join(customTemplateDir, 'context-test.hbs'), contextTestTemplate)

			// Act
			const result = await renderTemplate(
				join(customTemplateDir, 'context-test.hbs'),
				{
					namePascal: 'TestName',
					nameKebab: 'test-name',
					nameCamel: 'testName',
					nameSnake: 'test_name',
					nameScreamingSnake: 'TEST_NAME',
					fileName: 'test-name',
					portSuffix: 'PORT',
					adapterSuffix: 'Adapter',
				},
			)

			// Assert
			expect(result).toContain('pascal: TestName')
			expect(result).toContain('kebab: test-name')
			expect(result).toContain('camel: testName')
			expect(result).toContain('snake: test_name')
			expect(result).toContain('screaming: TEST_NAME')
			expect(result).toContain('fileName: test-name')
			expect(result).toContain('portSuffix: PORT')
			expect(result).toContain('adapterSuffix: Adapter')
		})

		test('8.3.3 - error when custom template is invalid (syntax error)', async () => {
			// Arrange: Create template with invalid Handlebars syntax
			const customTemplateDir = join(testDir, 'custom-templates')
			await mkdir(customTemplateDir, { recursive: true })

			const invalidTemplate = `{{#if condition}
Missing closing if block
`
			await fsWriteFile(join(customTemplateDir, 'invalid.hbs'), invalidTemplate)

			// Act & Assert
			await expect(
				renderTemplate(join(customTemplateDir, 'invalid.hbs'), {}),
			).rejects.toThrow('Failed to compile template')
		})

		test('error when template file is missing', async () => {
			// Act & Assert
			await expect(
				renderTemplate(join(testDir, 'non-existent-template.hbs'), {}),
			).rejects.toThrow('Template file not found')
		})
	})

	/**
	 * Template String Rendering Tests
	 */
	describe('Template String Rendering', () => {
		test('renderTemplateString renders inline template', async () => {
			// Act
			const result = await renderTemplateString(
				'Hello {{name}}, your port is {{portName}}',
				{ name: 'World', portName: 'OBJECT_STORAGE_PORT' },
			)

			// Assert
			expect(result).toBe('Hello World, your port is OBJECT_STORAGE_PORT')
		})

		test('renderTemplateString handles conditionals', async () => {
			// Act
			const result = await renderTemplateString(
				'{{#if includeModule}}Module included{{else}}No module{{/if}}',
				{ includeModule: true },
			)

			// Assert
			expect(result).toBe('Module included')
		})

		test('renderTemplateString errors on invalid syntax', async () => {
			// Act & Assert
			await expect(
				renderTemplateString('{{#if}}missing condition{{/if}}', {}),
			).rejects.toThrow('Failed to compile template string')
		})
	})

	/**
	 * All Name Variations Available in Context
	 */
	describe('Name Variations in Context', () => {
		test('generator provides all name variations to templates', async () => {
			// Arrange
			const config = configBuilder().build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'my-test-port',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert: Check generated content uses correct variations
			const tokenFile = join(testDir, 'src/ports/my-test-port/my-test-port.token.ts')
			const tokenContent = await Bun.file(tokenFile).text()

			// SCREAMING_SNAKE for token
			expect(tokenContent).toContain('MY_TEST_PORT_PORT')
			// PascalCase for type
			expect(tokenContent).toContain('MyTestPortToken')

			const serviceFile = join(testDir, 'src/ports/my-test-port/my-test-port.service.ts')
			const serviceContent = await Bun.file(serviceFile).text()

			// PascalCase for class
			expect(serviceContent).toContain('MyTestPortService')
			// camelCase for variable
			expect(serviceContent).toContain('myTestPort')
		})
	})

	/**
	 * Style Application Tests
	 */
	describe('Style Application to Templates', () => {
		test('double quotes style is applied', async () => {
			// Arrange
			const config = configBuilder()
				.withQuotes('double')
				.build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'quote-test',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert
			const tokenFile = join(testDir, 'src/ports/quote-test/quote-test.token.ts')
			const tokenContent = await Bun.file(tokenFile).text()

			// Should have double quotes for Symbol
			expect(tokenContent).toContain('Symbol("QUOTE_TEST_PORT")')
		})

		test('space indentation is applied', async () => {
			// Arrange
			const config = configBuilder()
				.withIndent(2)
				.build()
			const generator = new PortGenerator(config)

			// Act
			await generator.generate({
				name: 'indent-test',
				outputPath: join(testDir, 'src/ports'),
			})

			// Assert
			const serviceFile = join(testDir, 'src/ports/indent-test/indent-test.service.ts')
			const serviceContent = await Bun.file(serviceFile).text()

			// Should have spaces, not tabs
			expect(serviceContent).not.toContain('\t')
			// Should have 2-space indentation
			expect(serviceContent).toMatch(/^  /m)
		})
	})
})
