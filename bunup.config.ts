import { defineConfig } from 'bunup'

const config: ReturnType<typeof defineConfig> = defineConfig({
	entry: 'src/index.ts',
	outDir: 'dist',
	format: 'cjs', // Output CommonJS format
	dts: true, // Generate .d.ts files
	clean: true,
})

export default config
