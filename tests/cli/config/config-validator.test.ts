import { describe, expect, test } from 'bun:test'
import {
	validateConfig,
	ConfigValidationError,
} from '../../../src/cli/config/validator'
import type { NestHexConfig } from '../../../src/cli/types'
import { configBuilder } from '../helpers'

/**
 * Tests for config validator verifying:
 * - Valid configurations pass validation
 * - Invalid values are rejected with helpful error messages
 * - Type checking for all config properties
 */
describe('Config Validator', () => {
	describe('valid configuration', () => {
		test('passes validation with default config', () => {
			// Arrange
			const config = configBuilder().build()

			// Act & Assert: Should not throw
			expect(() => validateConfig(config)).not.toThrow()
		})

		test('passes validation with all valid custom values', () => {
			// Arrange
			const config = configBuilder()
				.withPortsDir('custom/ports')
				.withAdaptersDir('custom/adapters')
				.withPortSuffix('CONTRACT')
				.withAdapterSuffix('Implementation')
				.withFileCase('pascal')
				.withIndent(2)
				.withQuotes('double')
				.withSemicolons(false)
				.build()

			// Act & Assert: Should not throw
			expect(() => validateConfig(config)).not.toThrow()
		})

		test('passes validation with tab indent', () => {
			// Arrange
			const config = configBuilder().withIndent('tab').build()

			// Act & Assert: Should not throw
			expect(() => validateConfig(config)).not.toThrow()
		})

		test('passes validation with 2-space indent', () => {
			// Arrange
			const config = configBuilder().withIndent(2).build()

			// Act & Assert: Should not throw
			expect(() => validateConfig(config)).not.toThrow()
		})

		test('passes validation with 4-space indent', () => {
			// Arrange
			const config = configBuilder().withIndent(4).build()

			// Act & Assert: Should not throw
			expect(() => validateConfig(config)).not.toThrow()
		})

		test('passes validation with all fileCase options', () => {
			// Arrange & Act & Assert
			const kebabConfig = configBuilder().withFileCase('kebab').build()
			expect(() => validateConfig(kebabConfig)).not.toThrow()

			const camelConfig = configBuilder().withFileCase('camel').build()
			expect(() => validateConfig(camelConfig)).not.toThrow()

			const pascalConfig = configBuilder().withFileCase('pascal').build()
			expect(() => validateConfig(pascalConfig)).not.toThrow()
		})

		test('passes validation with both quote styles', () => {
			// Arrange & Act & Assert
			const singleQuotes = configBuilder().withQuotes('single').build()
			expect(() => validateConfig(singleQuotes)).not.toThrow()

			const doubleQuotes = configBuilder().withQuotes('double').build()
			expect(() => validateConfig(doubleQuotes)).not.toThrow()
		})

		test('passes validation with custom templates', () => {
			// Arrange
			const config = configBuilder()
				.withTemplate('portInterface', 'custom/port.hbs')
				.withTemplate('adapterService', 'custom/adapter.hbs')
				.build()

			// Act & Assert: Should not throw
			expect(() => validateConfig(config)).not.toThrow()
		})
	})

	describe('invalid fileCase values', () => {
		test('rejects invalid fileCase value', () => {
			// Arrange: Create config with invalid fileCase
			const config = {
				...configBuilder().build(),
				naming: {
					...configBuilder().build().naming,
					fileCase: 'snake' as never, // Invalid value
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
			expect(() => validateConfig(config)).toThrow(
				"fileCase must be 'kebab', 'camel', or 'pascal'",
			)
		})

		test('provides helpful error message for invalid fileCase', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				naming: {
					...configBuilder().build().naming,
					fileCase: 'UPPERCASE' as never,
				},
			}

			// Act & Assert
			try {
				validateConfig(config)
				expect(true).toBe(false) // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(ConfigValidationError)
				expect((error as Error).message).toContain('UPPERCASE')
				expect((error as Error).message).toContain('kebab')
				expect((error as Error).message).toContain('camel')
				expect((error as Error).message).toContain('pascal')
			}
		})
	})

	describe('invalid indent values', () => {
		test('rejects invalid indent value', () => {
			// Arrange: Create config with invalid indent
			const config = {
				...configBuilder().build(),
				style: {
					...configBuilder().build().style,
					indent: 3 as never, // Invalid value (not 2, 4, or 'tab')
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
			expect(() => validateConfig(config)).toThrow(
				"indent must be 'tab', 2, or 4",
			)
		})

		test('rejects string number as indent', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				style: {
					...configBuilder().build().style,
					indent: '2' as never, // Invalid: string instead of number
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
		})

		test('provides helpful error message for invalid indent', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				style: {
					...configBuilder().build().style,
					indent: 8 as never,
				},
			}

			// Act & Assert
			try {
				validateConfig(config)
				expect(true).toBe(false) // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(ConfigValidationError)
				expect((error as Error).message).toContain('8')
				expect((error as Error).message).toContain('tab')
				expect((error as Error).message).toContain('2')
				expect((error as Error).message).toContain('4')
			}
		})
	})

	describe('invalid quotes values', () => {
		test('rejects invalid quotes value', () => {
			// Arrange: Create config with invalid quotes
			const config = {
				...configBuilder().build(),
				style: {
					...configBuilder().build().style,
					quotes: 'backtick' as never, // Invalid value
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
			expect(() => validateConfig(config)).toThrow(
				"quotes must be 'single' or 'double'",
			)
		})

		test('provides helpful error message for invalid quotes', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				style: {
					...configBuilder().build().style,
					quotes: 'none' as never,
				},
			}

			// Act & Assert
			try {
				validateConfig(config)
				expect(true).toBe(false) // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(ConfigValidationError)
				expect((error as Error).message).toContain('none')
				expect((error as Error).message).toContain('single')
				expect((error as Error).message).toContain('double')
			}
		})
	})

	describe('type validation', () => {
		test('rejects non-string portsDir', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				output: {
					...configBuilder().build().output,
					portsDir: 123 as never,
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
			expect(() => validateConfig(config)).toThrow('portsDir must be a string')
		})

		test('rejects non-string adaptersDir', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				output: {
					...configBuilder().build().output,
					adaptersDir: true as never,
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
			expect(() => validateConfig(config)).toThrow('adaptersDir must be a string')
		})

		test('rejects non-string portSuffix', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				naming: {
					...configBuilder().build().naming,
					portSuffix: 42 as never,
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
			expect(() => validateConfig(config)).toThrow('portSuffix must be a string')
		})

		test('rejects non-string adapterSuffix', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				naming: {
					...configBuilder().build().naming,
					adapterSuffix: null as never,
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
			expect(() => validateConfig(config)).toThrow(
				'adapterSuffix must be a string',
			)
		})

		test('rejects non-string template paths', () => {
			// Arrange
			const config: NestHexConfig = {
				...configBuilder().build(),
				templates: {
					portInterface: 123 as never,
				},
			}

			// Act & Assert
			expect(() => validateConfig(config)).toThrow(ConfigValidationError)
			expect(() => validateConfig(config)).toThrow(
				'templates.portInterface must be a string',
			)
		})
	})

	describe('helpful error messages', () => {
		test('error message includes the invalid value', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				naming: {
					...configBuilder().build().naming,
					fileCase: 'INVALID' as never,
				},
			}

			// Act & Assert
			try {
				validateConfig(config)
				expect(true).toBe(false) // Should not reach here
			} catch (error) {
				expect((error as Error).message).toContain('INVALID')
			}
		})

		test('error message includes valid options', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				style: {
					...configBuilder().build().style,
					indent: 16 as never,
				},
			}

			// Act & Assert
			try {
				validateConfig(config)
				expect(true).toBe(false) // Should not reach here
			} catch (error) {
				const message = (error as Error).message
				expect(message).toContain("'tab'")
				expect(message).toContain('2')
				expect(message).toContain('4')
			}
		})

		test('error has correct name', () => {
			// Arrange
			const config = {
				...configBuilder().build(),
				style: {
					...configBuilder().build().style,
					quotes: 'invalid' as never,
				},
			}

			// Act & Assert
			try {
				validateConfig(config)
				expect(true).toBe(false) // Should not reach here
			} catch (error) {
				expect((error as Error).name).toBe('ConfigValidationError')
			}
		})
	})
})
