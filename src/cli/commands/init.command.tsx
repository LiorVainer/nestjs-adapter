/**
 * Init Command
 *
 * Creates nest-hex.config.ts configuration file.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Box, render, Text } from 'ink'

const CONFIG_TEMPLATE = `import { defineConfig } from 'nest-hex/cli'

export default defineConfig({
	output: {
		portsDir: 'src/ports',
		adaptersDir: 'src/adapters',
	},
	naming: {
		portSuffix: 'PORT',
		adapterSuffix: 'Adapter',
		fileCase: 'kebab',
	},
	style: {
		indent: 'tab',
		quotes: 'single',
		semicolons: true,
	},
	templates: {
		// Optionally override default templates
		// portModule: './templates/custom-port.hbs',
	},
})
`

interface InitCommandOptions {
	force?: boolean
}

/**
 * Detect if running within the nest-hex package itself (development mode)
 */
function isInternalDevelopment(): boolean {
	try {
		const packageJsonPath = join(process.cwd(), 'package.json')
		if (!existsSync(packageJsonPath)) return false
		const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
		const pkg = JSON.parse(packageJsonContent)
		return pkg.name === 'nest-hex'
	} catch {
		return false
	}
}

/**
 * Initialize nest-hex configuration file.
 */
export async function initCommand(
	options: InitCommandOptions = {},
): Promise<void> {
	const configPath = join(process.cwd(), 'nest-hex.config.ts')
	const configExists = existsSync(configPath)

	// Use relative import for internal development, package import for end users
	const importPath = isInternalDevelopment() ? './src/cli' : 'nest-hex/cli'
	const configContent = CONFIG_TEMPLATE.replace('nest-hex/cli', importPath)

	if (configExists && !options.force) {
		const { waitUntilExit } = render(
			<Box flexDirection="column">
				<Text color="yellow">⚠️ Configuration file already exists</Text>
				<Text dimColor>Use --force to overwrite</Text>
			</Box>,
		)
		await waitUntilExit()
		process.exit(1)
	}

	try {
		writeFileSync(configPath, configContent, 'utf-8')

		const { waitUntilExit } = render(
			<Box flexDirection="column" paddingY={1}>
				<Text color="green" bold>
					✅ Created nest-hex.config.ts
				</Text>
				<Text dimColor>Configuration file created at: {configPath}</Text>
				<Box marginTop={1}>
					<Text bold>💡 Next steps:</Text>
				</Box>
				<Box marginLeft={2}>
					<Text>• Edit nest-hex.config.ts to customize settings</Text>
				</Box>
				<Box marginLeft={2}>
					<Text>• Run `npx nest-hex generate` to create components</Text>
				</Box>
			</Box>,
		)
		await waitUntilExit()
	} catch (error) {
		const { waitUntilExit } = render(
			<Box flexDirection="column">
				<Text color="red" bold>
					❌ Failed to create configuration file
				</Text>
				<Text color="red">
					{error instanceof Error ? error.message : String(error)}
				</Text>
			</Box>,
		)
		await waitUntilExit()
		process.exit(1)
	}
}
