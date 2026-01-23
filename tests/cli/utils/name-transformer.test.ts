import { describe, expect, test } from 'bun:test'
import {
	generateNameVariations,
	toCamelCase,
	toKebabCase,
	toPascalCase,
	toScreamingSnakeCase,
	toSnakeCase,
} from '../../../src/cli/utils/name-transformer'

/**
 * Unit tests for name transformation utilities.
 * These utilities are critical for consistent naming across generated files.
 */
describe('Name Transformer Utilities', () => {
	describe('toKebabCase', () => {
		test('converts PascalCase to kebab-case', () => {
			expect(toKebabCase('ObjectStorage')).toBe('object-storage')
			expect(toKebabCase('UserAuth')).toBe('user-auth')
			// HTTPClient: no lowercase before capitals, so no separator inserted
			expect(toKebabCase('HTTPClient')).toBe('httpclient')
		})

		test('converts camelCase to kebab-case', () => {
			expect(toKebabCase('objectStorage')).toBe('object-storage')
			expect(toKebabCase('userAuth')).toBe('user-auth')
		})

		test('preserves existing kebab-case', () => {
			expect(toKebabCase('object-storage')).toBe('object-storage')
			expect(toKebabCase('user-auth')).toBe('user-auth')
		})

		test('converts snake_case to kebab-case', () => {
			expect(toKebabCase('object_storage')).toBe('object-storage')
			expect(toKebabCase('user_auth')).toBe('user-auth')
		})

		test('handles single words', () => {
			expect(toKebabCase('storage')).toBe('storage')
			expect(toKebabCase('Storage')).toBe('storage')
		})

		test('handles numbers', () => {
			expect(toKebabCase('s3Storage')).toBe('s3-storage')
			// OAuth2Client: 2C matches ([a-z0-9])([A-Z]), so o-auth-2-client? No, it's oauth2-client
			expect(toKebabCase('OAuth2Client')).toBe('oauth2-client')
		})

		test('handles consecutive capitals', () => {
			// Note: Current implementation doesn't separate consecutive capitals
			// XMLParser -> xmlparser, not xml-parser
			expect(toKebabCase('XMLParser')).toBe('xmlparser')
			expect(toKebabCase('HTTPSConnection')).toBe('httpsconnection')
		})
	})

	describe('toCamelCase', () => {
		test('converts kebab-case to camelCase', () => {
			expect(toCamelCase('object-storage')).toBe('objectStorage')
			expect(toCamelCase('user-auth')).toBe('userAuth')
		})

		test('converts PascalCase to camelCase', () => {
			expect(toCamelCase('ObjectStorage')).toBe('objectStorage')
			expect(toCamelCase('UserAuth')).toBe('userAuth')
		})

		test('preserves existing camelCase', () => {
			expect(toCamelCase('objectStorage')).toBe('objectStorage')
			expect(toCamelCase('userAuth')).toBe('userAuth')
		})

		test('converts snake_case to camelCase', () => {
			expect(toCamelCase('object_storage')).toBe('objectStorage')
			expect(toCamelCase('user_auth')).toBe('userAuth')
		})

		test('handles single words', () => {
			expect(toCamelCase('storage')).toBe('storage')
			expect(toCamelCase('Storage')).toBe('storage')
		})
	})

	describe('toPascalCase', () => {
		test('converts kebab-case to PascalCase', () => {
			expect(toPascalCase('object-storage')).toBe('ObjectStorage')
			expect(toPascalCase('user-auth')).toBe('UserAuth')
		})

		test('converts camelCase to PascalCase', () => {
			expect(toPascalCase('objectStorage')).toBe('ObjectStorage')
			expect(toPascalCase('userAuth')).toBe('UserAuth')
		})

		test('preserves existing PascalCase', () => {
			expect(toPascalCase('ObjectStorage')).toBe('ObjectStorage')
			expect(toPascalCase('UserAuth')).toBe('UserAuth')
		})

		test('converts snake_case to PascalCase', () => {
			expect(toPascalCase('object_storage')).toBe('ObjectStorage')
			expect(toPascalCase('user_auth')).toBe('UserAuth')
		})

		test('handles single words', () => {
			expect(toPascalCase('storage')).toBe('Storage')
			expect(toPascalCase('Storage')).toBe('Storage')
		})
	})

	describe('toSnakeCase', () => {
		test('converts kebab-case to snake_case', () => {
			expect(toSnakeCase('object-storage')).toBe('object_storage')
			expect(toSnakeCase('user-auth')).toBe('user_auth')
		})

		test('converts camelCase to snake_case', () => {
			expect(toSnakeCase('objectStorage')).toBe('object_storage')
			expect(toSnakeCase('userAuth')).toBe('user_auth')
		})

		test('converts PascalCase to snake_case', () => {
			expect(toSnakeCase('ObjectStorage')).toBe('object_storage')
			expect(toSnakeCase('UserAuth')).toBe('user_auth')
		})

		test('preserves existing snake_case', () => {
			expect(toSnakeCase('object_storage')).toBe('object_storage')
			expect(toSnakeCase('user_auth')).toBe('user_auth')
		})

		test('handles single words', () => {
			expect(toSnakeCase('storage')).toBe('storage')
			expect(toSnakeCase('Storage')).toBe('storage')
		})
	})

	describe('toScreamingSnakeCase', () => {
		test('converts kebab-case to SCREAMING_SNAKE_CASE', () => {
			expect(toScreamingSnakeCase('object-storage')).toBe('OBJECT_STORAGE')
			expect(toScreamingSnakeCase('user-auth')).toBe('USER_AUTH')
		})

		test('converts camelCase to SCREAMING_SNAKE_CASE', () => {
			expect(toScreamingSnakeCase('objectStorage')).toBe('OBJECT_STORAGE')
			expect(toScreamingSnakeCase('userAuth')).toBe('USER_AUTH')
		})

		test('converts PascalCase to SCREAMING_SNAKE_CASE', () => {
			expect(toScreamingSnakeCase('ObjectStorage')).toBe('OBJECT_STORAGE')
			expect(toScreamingSnakeCase('UserAuth')).toBe('USER_AUTH')
		})

		test('converts snake_case to SCREAMING_SNAKE_CASE', () => {
			expect(toScreamingSnakeCase('object_storage')).toBe('OBJECT_STORAGE')
			expect(toScreamingSnakeCase('user_auth')).toBe('USER_AUTH')
		})

		test('handles single words', () => {
			expect(toScreamingSnakeCase('storage')).toBe('STORAGE')
			expect(toScreamingSnakeCase('Storage')).toBe('STORAGE')
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

		test('generates all variations from camelCase input', () => {
			const result = generateNameVariations('objectStorage')

			expect(result).toEqual({
				kebab: 'object-storage',
				camel: 'objectStorage',
				pascal: 'ObjectStorage',
				snake: 'object_storage',
				screamingSnake: 'OBJECT_STORAGE',
				original: 'objectStorage',
			})
		})

		test('generates all variations from snake_case input', () => {
			const result = generateNameVariations('object_storage')

			expect(result).toEqual({
				kebab: 'object-storage',
				camel: 'objectStorage',
				pascal: 'ObjectStorage',
				snake: 'object_storage',
				screamingSnake: 'OBJECT_STORAGE',
				original: 'object_storage',
			})
		})

		test('preserves original input in result', () => {
			expect(generateNameVariations('MyCustomName').original).toBe('MyCustomName')
			expect(generateNameVariations('my-custom-name').original).toBe('my-custom-name')
			expect(generateNameVariations('my_custom_name').original).toBe('my_custom_name')
		})
	})

	describe('edge cases', () => {
		test('handles empty string', () => {
			expect(toKebabCase('')).toBe('')
			expect(toCamelCase('')).toBe('')
			expect(toPascalCase('')).toBe('')
			expect(toSnakeCase('')).toBe('')
			expect(toScreamingSnakeCase('')).toBe('')
		})

		test('handles single character', () => {
			expect(toKebabCase('a')).toBe('a')
			expect(toCamelCase('a')).toBe('a')
			expect(toPascalCase('A')).toBe('A')
			expect(toSnakeCase('a')).toBe('a')
			expect(toScreamingSnakeCase('a')).toBe('A')
		})

		test('handles names with numbers', () => {
			const result = generateNameVariations('s3-storage-v2')

			expect(result.kebab).toBe('s3-storage-v2')
			expect(result.camel).toBe('s3StorageV2')
			expect(result.pascal).toBe('S3StorageV2')
			expect(result.snake).toBe('s3_storage_v2')
			expect(result.screamingSnake).toBe('S3_STORAGE_V2')
		})

		test('handles names with consecutive capitals', () => {
			const result = generateNameVariations('HTTPSConnection')

			// Note: Current implementation doesn't separate consecutive capitals
			expect(result.kebab).toBe('httpsconnection')
			// toCamelCase doesn't recognize uppercase transitions, keeps them
			expect(result.camel).toBe('hTTPSConnection')
			expect(result.pascal).toBe('HTTPSConnection')
			expect(result.snake).toBe('httpsconnection')
			expect(result.screamingSnake).toBe('HTTPSCONNECTION')
		})

		test('handles acronyms', () => {
			const result = generateNameVariations('API')

			expect(result.kebab).toBe('api')
			// Note: toCamelCase on 'API' gives 'aPI' because it only lowercases first char
			expect(result.camel).toBe('aPI')
			expect(result.pascal).toBe('API')
			expect(result.snake).toBe('api')
			expect(result.screamingSnake).toBe('API')
		})

		test('handles mixed delimiters', () => {
			// Input with both hyphens and underscores
			expect(toKebabCase('object-storage_provider')).toBe('object-storage-provider')
			expect(toCamelCase('object-storage_provider')).toBe('objectStorageProvider')
			expect(toPascalCase('object-storage_provider')).toBe('ObjectStorageProvider')
		})
	})

	describe('real-world examples', () => {
		test('handles common port names', () => {
			const examples = [
				'object-storage',
				'currency-rates',
				'user-authentication',
				'email-sender',
				'payment-processor',
			]

			for (const name of examples) {
				const variations = generateNameVariations(name)

				// All should produce valid identifiers
				expect(variations.camel).toMatch(/^[a-z][a-zA-Z0-9]*$/)
				expect(variations.pascal).toMatch(/^[A-Z][a-zA-Z0-9]*$/)
				expect(variations.screamingSnake).toMatch(/^[A-Z][A-Z0-9_]*$/)
			}
		})

		test('handles common adapter names', () => {
			const examples = ['s3', 'local-fs', 'redis-cache', 'postgres-repository', 'stripe-payment']

			for (const name of examples) {
				const variations = generateNameVariations(name)

				// All should produce valid identifiers
				expect(variations.camel).toMatch(/^[a-z][a-zA-Z0-9]*$/)
				expect(variations.pascal).toMatch(/^[A-Z][a-zA-Z0-9]*$/)
				expect(variations.screamingSnake).toMatch(/^[A-Z][A-Z0-9_]*$/)
			}
		})
	})
})
