import { defineConfig } from 'bunup'

// Build both the main library and the CLI
const config: ReturnType<typeof defineConfig> = defineConfig({
	entry: ['src/index.ts', 'src/cli/**/*.ts'],
	outDir: 'dist',
	format: 'cjs',
	dts: true,
	clean: true,
	// Don't bundle dependencies - they should be installed by users
	external: [
		'@nestjs/common',
		'reflect-metadata',
		'ink',
		'react',
		'@inkjs/ui',
		'commander',
		'handlebars',
	],
})

export default config
