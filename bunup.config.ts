import { defineConfig } from 'bunup'
import type { BunupConfig } from 'bunup'

const config: BunupConfig = defineConfig({
	entry: 'src/index.ts',
	outDir: 'dist',
	format: 'cjs', // Output CommonJS format
	dts: true, // Generate .d.ts files
	clean: true,
})

export default config
