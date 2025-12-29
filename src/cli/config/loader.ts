/**
 * Configuration loader
 * Uses Bun's native file checking for better performance
 */

import { join } from 'node:path'
import { merge } from 'ts-deepmerge'
import type { NestHexConfig } from '../types'
import { defaultConfig } from './defaults'

export async function loadConfig(
	cwd: string = process.cwd(),
): Promise<NestHexConfig> {
	const configPath = join(cwd, 'nest-hex.config.ts')

	// Use Bun's file API to check if config exists
	const configFile = Bun.file(configPath)
	if (!(await configFile.exists())) {
		return defaultConfig
	}

	try {
		// Dynamic import works natively in Bun with TypeScript
		const config = await import(configPath)
		// Use deep merge to properly merge nested config objects
		return merge(defaultConfig, config.default ?? {}) as NestHexConfig
	} catch (error) {
		console.warn('Failed to load config, using defaults:', error)
		return defaultConfig
	}
}
