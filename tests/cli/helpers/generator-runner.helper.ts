import { join } from 'node:path'
import type { NestHexConfig } from '../../../src/cli/types'
import type { GeneratorOptions, GeneratorResult } from '../../../src/cli/types'
import { PortGenerator } from '../../../src/cli/generators/port.generator'
import { AdapterGenerator } from '../../../src/cli/generators/adapter.generator'
import { ServiceGenerator } from '../../../src/cli/generators/service.generator'

/**
 * Generator runner for tests.
 * Provides a unified interface to run any generator with convenience methods.
 *
 * @example
 * ```typescript
 * const runner = createGeneratorRunner(config, testDir)
 * const result = await runner.generatePort('object-storage')
 * expect(result.success).toBe(true)
 * expect(result.files).toHaveLength(5)
 * ```
 */
export class GeneratorRunner {
	constructor(
		private readonly config: NestHexConfig,
		private readonly baseOutputPath: string,
	) {}

	/**
	 * Generate a port with the given name and options.
	 *
	 * @param name - Port name
	 * @param options - Additional generation options
	 * @returns Generation result
	 */
	async generatePort(
		name: string,
		options: Partial<GeneratorOptions> = {},
	): Promise<GeneratorResult> {
		const generator = new PortGenerator(this.config)
		return generator.generate({
			name,
			outputPath: this.baseOutputPath,
			...options,
		})
	}

	/**
	 * Generate an adapter with the given name and options.
	 *
	 * @param name - Adapter name
	 * @param options - Additional generation options
	 * @returns Generation result
	 */
	async generateAdapter(
		name: string,
		options: Partial<GeneratorOptions> = {},
	): Promise<GeneratorResult> {
		const generator = new AdapterGenerator(this.config)
		return generator.generate({
			name,
			outputPath: this.baseOutputPath,
			...options,
		})
	}

	/**
	 * Generate a service with the given name and options.
	 *
	 * @param name - Service name
	 * @param options - Additional generation options
	 * @returns Generation result
	 */
	async generateService(
		name: string,
		options: Partial<GeneratorOptions> = {},
	): Promise<GeneratorResult> {
		const generator = new ServiceGenerator(this.config)
		return generator.generate({
			name,
			outputPath: this.baseOutputPath,
			...options,
		})
	}

	/**
	 * Verify that a file exists at the expected location.
	 *
	 * @param relativePath - Path relative to base output path
	 * @returns True if file exists
	 */
	async fileExists(relativePath: string): Promise<boolean> {
		const fullPath = join(this.baseOutputPath, relativePath)
		const file = Bun.file(fullPath)
		return file.exists()
	}

	/**
	 * Read a generated file's contents.
	 *
	 * @param relativePath - Path relative to base output path
	 * @returns File contents as string
	 */
	async readFile(relativePath: string): Promise<string> {
		const fullPath = join(this.baseOutputPath, relativePath)
		const file = Bun.file(fullPath)
		return file.text()
	}

	/**
	 * Verify that all expected files exist.
	 *
	 * @param relativePaths - Array of paths relative to base output path
	 * @returns Object mapping each path to existence status
	 */
	async verifyFilesExist(
		relativePaths: string[],
	): Promise<Record<string, boolean>> {
		const results: Record<string, boolean> = {}

		for (const path of relativePaths) {
			results[path] = await this.fileExists(path)
		}

		return results
	}

	/**
	 * Get the full path for a relative path.
	 *
	 * @param relativePath - Path relative to base output path
	 * @returns Full absolute path
	 */
	getFullPath(relativePath: string): string {
		return join(this.baseOutputPath, relativePath)
	}

	/**
	 * Assert that a file contains specific content.
	 *
	 * @param relativePath - Path relative to base output path
	 * @param expectedContent - Content that should be present
	 * @returns True if content is found
	 */
	async fileContains(
		relativePath: string,
		expectedContent: string | string[],
	): Promise<boolean> {
		const content = await this.readFile(relativePath)
		const patterns = Array.isArray(expectedContent)
			? expectedContent
			: [expectedContent]

		return patterns.every((pattern) => content.includes(pattern))
	}

	/**
	 * Assert that a file does NOT contain specific content.
	 *
	 * @param relativePath - Path relative to base output path
	 * @param unexpectedContent - Content that should NOT be present
	 * @returns True if content is NOT found
	 */
	async fileDoesNotContain(
		relativePath: string,
		unexpectedContent: string | string[],
	): Promise<boolean> {
		const content = await this.readFile(relativePath)
		const patterns = Array.isArray(unexpectedContent)
			? unexpectedContent
			: [unexpectedContent]

		return patterns.every((pattern) => !content.includes(pattern))
	}

	/**
	 * Get standard port file paths for a given port name.
	 * Useful for verifying port generation.
	 *
	 * @param portName - Name of the port (in kebab-case)
	 * @param options - Options to determine which files to include
	 * @returns Array of expected file paths
	 */
	getExpectedPortFiles(
		portName: string,
		options: {
			includeModule?: boolean
			includeService?: boolean
			fileCase?: 'kebab' | 'camel' | 'pascal'
		} = {},
	): string[] {
		const {
			includeModule = true,
			includeService = true,
			fileCase = 'kebab',
		} = options

		// Transform portName based on fileCase
		const fileName =
			fileCase === 'pascal'
				? this.toPascalCase(portName)
				: fileCase === 'camel'
					? this.toCamelCase(portName)
					: portName

		const dirName = fileName
		const files = [
			`${dirName}/${fileName}.token.ts`,
			`${dirName}/${fileName}.port.ts`,
			`${dirName}/index.ts`,
		]

		if (includeService) {
			files.splice(2, 0, `${dirName}/${fileName}.service.ts`)
		}

		if (includeModule) {
			files.splice(includeService ? 3 : 2, 0, `${dirName}/${fileName}.module.ts`)
		}

		return files
	}

	/**
	 * Get standard adapter file paths for a given adapter name.
	 * Useful for verifying adapter generation.
	 *
	 * @param adapterName - Name of the adapter (in kebab-case)
	 * @param options - Options to determine file case
	 * @returns Array of expected file paths
	 */
	getExpectedAdapterFiles(
		adapterName: string,
		options: {
			fileCase?: 'kebab' | 'camel' | 'pascal'
		} = {},
	): string[] {
		const { fileCase = 'kebab' } = options

		// Transform adapterName based on fileCase
		const fileName =
			fileCase === 'pascal'
				? this.toPascalCase(adapterName)
				: fileCase === 'camel'
					? this.toCamelCase(adapterName)
					: adapterName

		const dirName = fileName

		return [
			`${dirName}/${fileName}.adapter.ts`,
			`${dirName}/${fileName}.service.ts`,
			`${dirName}/${fileName}.types.ts`,
			`${dirName}/index.ts`,
		]
	}

	/**
	 * Helper: Convert string to PascalCase
	 */
	private toPascalCase(str: string): string {
		return str
			.split(/[-_\s]+/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join('')
	}

	/**
	 * Helper: Convert string to camelCase
	 */
	private toCamelCase(str: string): string {
		const pascal = this.toPascalCase(str)
		return pascal.charAt(0).toLowerCase() + pascal.slice(1)
	}
}

/**
 * Create a new generator runner instance.
 *
 * @param config - NestHex configuration
 * @param baseOutputPath - Base directory for generated files
 * @returns Generator runner instance
 */
export function createGeneratorRunner(
	config: NestHexConfig,
	baseOutputPath: string,
): GeneratorRunner {
	return new GeneratorRunner(config, baseOutputPath)
}

/**
 * Type guard to check if a result is successful.
 *
 * @param result - Generator result
 * @returns True if generation was successful
 */
export function isSuccessful(result: GeneratorResult): boolean {
	return result.success && result.files.length > 0
}

/**
 * Assert that generation result is successful.
 * Throws if generation failed.
 *
 * @param result - Generator result
 * @param context - Optional context for error message
 * @throws Error if generation failed
 */
export function assertGenerationSuccess(
	result: GeneratorResult,
	context = '',
): asserts result is GeneratorResult & { success: true } {
	if (!result.success) {
		const errorMsg = context
			? `Generation failed (${context}): ${result.message || 'Unknown error'}`
			: `Generation failed: ${result.message || 'Unknown error'}`
		throw new Error(errorMsg)
	}

	if (result.files.length === 0) {
		const errorMsg = context
			? `No files were generated (${context})`
			: 'No files were generated'
		throw new Error(errorMsg)
	}
}
