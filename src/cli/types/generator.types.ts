/**
 * Generator types for CLI
 */

export interface GeneratorOptions {
	name: string
	outputPath?: string
	includeModule?: boolean
	includeService?: boolean
	registrationType?: 'sync' | 'async'
	generateExample?: boolean
	dryRun?: boolean
	force?: boolean
}

export interface GeneratorContext extends Record<string, unknown> {
	// Name variations
	original: string
	kebab: string
	camel: string
	pascal: string
	snake: string
	screamingSnake: string
	nameKebab: string
	nameCamel: string
	namePascal: string
	nameSnake: string
	nameScreamingSnake: string

	// File name (transformed based on fileCase config)
	fileName: string

	// Configuration
	portSuffix: string
	adapterSuffix: string
	fileCase: 'kebab' | 'camel' | 'pascal'

	// Style
	indent: 'tab' | number
	quotes: 'single' | 'double'
	semicolons: boolean

	// Options
	includeModule: boolean
	includeService: boolean
	registrationType: 'sync' | 'async'
	generateExample: boolean

	// Import paths
	coreImportPath: string
}

export interface FileToGenerate {
	path: string
	content: string
}

export interface GeneratorResult {
	files: string[]
	success: boolean
	message?: string
}
