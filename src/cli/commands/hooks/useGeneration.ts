/**
 * Hook for managing the generation process
 */

import { useEffect, useState } from 'react'
import { loadConfig } from '../../config/loader'
import {
	AdapterGenerator,
	PortGenerator,
	ServiceGenerator,
} from '../../generators'
import type { GeneratorResult } from '../../types'
import type { ProgressStep } from '../../ui/components'
import { detectLinter } from '../../utils/linter-detector'
import { runLinter } from '../../utils/linter-runner'
import type { PortInfo } from '../../utils/port-scanner'

interface GenerationOptions {
	outputPath?: string
	dryRun?: boolean
	noLint?: boolean
	port?: string
}

interface GenerationParams {
	selectedType: 'port' | 'adapter' | 'service' | 'full' | undefined
	selectedName: string | undefined
	portName: string | undefined
	adapterName: string | undefined
	selectedPortInfo: PortInfo | null
	options: GenerationOptions
}

export interface GenerationState {
	steps: ProgressStep[]
	result: GeneratorResult | null
	portResultFiles: string[] | undefined
	adapterResultFiles: string[] | undefined
	duration: number | undefined
	error: Error | null
	isGenerating: boolean
}

export function useGeneration(params: GenerationParams): GenerationState {
	const {
		selectedType,
		selectedName,
		portName,
		adapterName,
		selectedPortInfo,
		options,
	} = params

	const [steps, setSteps] = useState<ProgressStep[]>([])
	const [result, setResult] = useState<GeneratorResult | null>(null)
	const [portResultFiles, setPortResultFiles] = useState<string[] | undefined>()
	const [adapterResultFiles, setAdapterResultFiles] = useState<
		string[] | undefined
	>()
	const [duration, setDuration] = useState<number | undefined>()
	const [error, setError] = useState<Error | null>(null)
	const [isGenerating, setIsGenerating] = useState(false)

	useEffect(() => {
		if (!selectedType) return
		if (selectedType === 'full' && (!portName || !adapterName)) return
		if (selectedType !== 'full' && !selectedName) return

		// Capture narrowed type for async function
		const type = selectedType

		async function generate() {
			setIsGenerating(true)
			const startTime = Date.now()

			try {
				setSteps([
					{
						id: 'config',
						label: 'Loading configuration',
						status: 'in_progress',
					},
				])

				const config = await loadConfig()

				setSteps((prev) =>
					prev.map((s) =>
						s.id === 'config' ? { ...s, status: 'completed' as const } : s,
					),
				)

				setSteps((prev) => [
					...prev,
					{
						id: 'generate',
						label: 'Generating files',
						status: 'in_progress' as const,
					},
				])

				let genResult: GeneratorResult

				if (type === 'full' && portName && adapterName) {
					const fullResult = await generateFull(
						config,
						portName,
						adapterName,
						options,
					)
					setPortResultFiles(fullResult.portFiles)
					setAdapterResultFiles(fullResult.adapterFiles)
					genResult = fullResult
				} else if (selectedName && type !== 'full') {
					genResult = await generateSingle(
						config,
						type,
						selectedName,
						selectedPortInfo,
						options,
					)
				} else {
					throw new Error(
						'Invalid state: selectedName is required for non-full generator types',
					)
				}

				setResult(genResult)
				setDuration(Date.now() - startTime)

				setSteps((prev) =>
					prev.map((s) =>
						s.id === 'generate' ? { ...s, status: 'completed' as const } : s,
					),
				)

				if (!options.noLint && !options.dryRun && genResult.success) {
					await runLinting(genResult.files, setSteps)
				}
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)))
				setSteps((prev) =>
					prev.map((s) =>
						s.status === 'in_progress'
							? { ...s, status: 'failed' as const }
							: s,
					),
				)
			} finally {
				setIsGenerating(false)
			}
		}

		generate()
	}, [
		selectedType,
		selectedName,
		portName,
		adapterName,
		options,
		selectedPortInfo,
	])

	return {
		steps,
		result,
		portResultFiles,
		adapterResultFiles,
		duration,
		error,
		isGenerating,
	}
}

interface FullGeneratorResult extends GeneratorResult {
	portFiles?: string[]
	adapterFiles?: string[]
}

async function generateFull(
	config: Awaited<ReturnType<typeof loadConfig>>,
	portName: string,
	adapterName: string,
	options: GenerationOptions,
): Promise<FullGeneratorResult> {
	const portGenerator = new PortGenerator(config)
	const portResult = await portGenerator.generate({
		name: portName,
		outputPath: options.outputPath,
		dryRun: options.dryRun,
	})

	const adapterGenerator = new AdapterGenerator(config)
	const adapterResult = await adapterGenerator.generate({
		name: adapterName,
		portName: portName,
		outputPath: options.outputPath,
		dryRun: options.dryRun,
	})

	return {
		success: portResult.success && adapterResult.success,
		files: [...(portResult.files || []), ...(adapterResult.files || [])],
		message:
			portResult.success && adapterResult.success
				? `Generated port '${portName}' and adapter '${adapterName}'`
				: 'Some files failed to generate',
		portFiles: portResult.files,
		adapterFiles: adapterResult.files,
	}
}

async function generateSingle(
	config: Awaited<ReturnType<typeof loadConfig>>,
	type: 'port' | 'adapter' | 'service' | 'full',
	name: string,
	selectedPortInfo: PortInfo | null,
	options: GenerationOptions,
): Promise<GeneratorResult> {
	switch (type) {
		case 'port': {
			const generator = new PortGenerator(config)
			return generator.generate({
				name,
				outputPath: options.outputPath,
				dryRun: options.dryRun,
			})
		}
		case 'adapter': {
			const generator = new AdapterGenerator(config)
			return generator.generate({
				name,
				portName: selectedPortInfo?.name || options.port,
				portPath: selectedPortInfo?.tokenImportPath,
				portTokenName: selectedPortInfo?.tokenName,
				outputPath: options.outputPath,
				dryRun: options.dryRun,
			})
		}
		case 'service': {
			const generator = new ServiceGenerator(config)
			return generator.generate({
				name,
				outputPath: options.outputPath,
				dryRun: options.dryRun,
			})
		}
		default:
			throw new Error(`Unknown generator type: ${type}`)
	}
}

async function runLinting(
	files: string[] | undefined,
	setSteps: React.Dispatch<React.SetStateAction<ProgressStep[]>>,
): Promise<void> {
	setSteps((prev) => [
		...prev,
		{
			id: 'lint',
			label: 'Linting files',
			status: 'in_progress' as const,
		},
	])

	const linterConfig = await detectLinter(process.cwd())

	if (linterConfig.type !== 'none' && files) {
		const lintResult = await runLinter(linterConfig, files, process.cwd())

		setSteps((prev) =>
			prev.map((s) =>
				s.id === 'lint'
					? {
							...s,
							status: lintResult.success
								? ('completed' as const)
								: ('failed' as const),
							message: lintResult.success ? 'Passed' : 'Failed (see output)',
						}
					: s,
			),
		)
	} else {
		setSteps((prev) =>
			prev.map((s) =>
				s.id === 'lint'
					? {
							...s,
							status: 'completed' as const,
							message: 'No linter detected',
						}
					: s,
			),
		)
	}
}
