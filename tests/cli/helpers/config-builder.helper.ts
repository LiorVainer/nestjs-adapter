import type { NestHexConfig } from '../../../src/cli/types'

/**
 * Builder for creating test configurations easily.
 * Provides fluent API for setting config options.
 *
 * @example
 * ```typescript
 * const config = configBuilder()
 *   .withPortsDir('custom/ports')
 *   .withFileCase('pascal')
 *   .withIndent(2)
 *   .build()
 * ```
 */
export class ConfigBuilder {
	private config: Partial<NestHexConfig> = {}

	/**
	 * Set custom ports directory
	 */
	withPortsDir(dir: string): this {
		if (!this.config.output) this.config.output = {}
		this.config.output.portsDir = dir
		return this
	}

	/**
	 * Set custom adapters directory
	 */
	withAdaptersDir(dir: string): this {
		if (!this.config.output) this.config.output = {}
		this.config.output.adaptersDir = dir
		return this
	}

	/**
	 * Set port token suffix
	 */
	withPortSuffix(suffix: string): this {
		if (!this.config.naming) this.config.naming = {}
		this.config.naming.portSuffix = suffix
		return this
	}

	/**
	 * Set adapter class suffix
	 */
	withAdapterSuffix(suffix: string): this {
		if (!this.config.naming) this.config.naming = {}
		this.config.naming.adapterSuffix = suffix
		return this
	}

	/**
	 * Set file naming case
	 */
	withFileCase(fileCase: 'kebab' | 'camel' | 'pascal'): this {
		if (!this.config.naming) this.config.naming = {}
		this.config.naming.fileCase = fileCase
		return this
	}

	/**
	 * Set indentation style
	 */
	withIndent(indent: 'tab' | 2 | 4): this {
		if (!this.config.style) this.config.style = {}
		this.config.style.indent = indent
		return this
	}

	/**
	 * Set quote style
	 */
	withQuotes(quotes: 'single' | 'double'): this {
		if (!this.config.style) this.config.style = {}
		this.config.style.quotes = quotes
		return this
	}

	/**
	 * Set semicolon preference
	 */
	withSemicolons(semicolons: boolean): this {
		if (!this.config.style) this.config.style = {}
		this.config.style.semicolons = semicolons
		return this
	}

	/**
	 * Set custom template for a component
	 */
	withTemplate(
		name: keyof NonNullable<NestHexConfig['templates']>,
		path: string,
	): this {
		if (!this.config.templates) this.config.templates = {}
		this.config.templates[name] = path
		return this
	}

	/**
	 * Build the final configuration object with defaults
	 */
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

	/**
	 * Reset builder to empty state
	 */
	reset(): this {
		this.config = {}
		return this
	}
}

/**
 * Create a new config builder instance
 */
export function configBuilder(): ConfigBuilder {
	return new ConfigBuilder()
}

/**
 * Predefined common test configurations
 */
export const testConfigs = {
	/**
	 * Minimal config with all defaults
	 */
	minimal: (): NestHexConfig => configBuilder().build(),

	/**
	 * Custom naming with CONTRACT suffix
	 */
	contractNaming: (): NestHexConfig =>
		configBuilder()
			.withPortSuffix('CONTRACT')
			.withAdapterSuffix('Implementation')
			.withFileCase('kebab')
			.build(),

	/**
	 * PascalCase file naming
	 */
	pascalCase: (): NestHexConfig => configBuilder().withFileCase('pascal').build(),

	/**
	 * 2-space indentation, double quotes, no semicolons (Prettier-style)
	 */
	prettier: (): NestHexConfig =>
		configBuilder().withIndent(2).withQuotes('double').withSemicolons(false).build(),

	/**
	 * Tab indentation, single quotes, semicolons (Biome/project default)
	 */
	biome: (): NestHexConfig =>
		configBuilder().withIndent('tab').withQuotes('single').withSemicolons(true).build(),

	/**
	 * Custom domain-driven directory structure
	 */
	domainDriven: (): NestHexConfig =>
		configBuilder()
			.withPortsDir('src/domain/ports')
			.withAdaptersDir('src/infrastructure/adapters')
			.build(),

	/**
	 * Fully customized config for comprehensive testing
	 */
	fullyCustom: (): NestHexConfig =>
		configBuilder()
			.withPortsDir('custom/domain/contracts')
			.withAdaptersDir('custom/infrastructure/implementations')
			.withPortSuffix('CONTRACT')
			.withAdapterSuffix('Impl')
			.withFileCase('pascal')
			.withIndent(4)
			.withQuotes('double')
			.withSemicolons(false)
			.build(),
}
