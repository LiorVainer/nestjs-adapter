/**
 * Generate Command
 *
 * Main command for generating ports, adapters, and services.
 */

import { Box, render, Text, useInput } from 'ink'
import { useEffect, useState } from 'react'
import { loadConfig } from '../config/loader'
import {
	AdapterGenerator,
	PortGenerator,
	ServiceGenerator,
} from '../generators'
import type { GeneratorResult } from '../types'
import {
	NameInput,
	PortSelector,
	ProgressIndicator,
	type ProgressStep,
	Summary,
	TypeSelector,
} from '../ui/components'
import { detectLinter } from '../utils/linter-detector'
import { runLinter } from '../utils/linter-runner'
import type { PortInfo } from '../utils/port-scanner'
import { scanAvailablePorts } from '../utils/port-scanner'

interface GenerateCommandOptions {
	type?: 'port' | 'adapter' | 'service' | 'full'
	name?: string
	portName?: string // For 'full' type from CLI args
	adapterName?: string // For 'full' type from CLI args
	outputPath?: string
	dryRun?: boolean
	force?: boolean
	noLint?: boolean
	port?: string
}

interface FileProgresState {
	fileName: string
	status: 'pending' | 'generating' | 'completed' | 'skipped' | 'failed'
	error?: string
}

/**
 * Main generation UI component
 */
function GenerateUI({ options }: { options: GenerateCommandOptions }) {
	const [selectedType, setSelectedType] = useState<
		'port' | 'adapter' | 'service' | 'full' | undefined
	>(options.type)
	const [selectedName, setSelectedName] = useState<string | undefined>(
		options.name,
	)
	const [portName, setPortName] = useState<string | undefined>(options.portName)
	const [adapterName, setAdapterName] = useState<string | undefined>(
		options.adapterName,
	)
	const [selectedPortInfo, setSelectedPortInfo] = useState<PortInfo | null>(
		null,
	)
	const [availablePorts, setAvailablePorts] = useState<PortInfo[]>([])
	const [portsLoaded, setPortsLoaded] = useState(false)
	const [showTypeSelector, setShowTypeSelector] = useState(!options.type)
	const [showPortSelector, setShowPortSelector] = useState(false)
	const [showNameInput, setShowNameInput] = useState(() => {
		// Show name input if type is provided but names are missing
		if (!options.type) return false
		if (options.type === 'full') {
			return !options.portName || !options.adapterName
		}
		return !options.name
	})
	const [nameInputStep, setNameInputStep] = useState<'port' | 'adapter'>(() => {
		// If port name is provided but adapter name is missing, start at adapter step
		if (options.type === 'full' && options.portName && !options.adapterName) {
			return 'adapter'
		}
		return 'port'
	})
	const [steps, setSteps] = useState<ProgressStep[]>([])
	const [_files, _setFiles] = useState<FileProgresState[]>([])
	const [result, setResult] = useState<GeneratorResult | null>(null)
	const [error, setError] = useState<Error | null>(null)

	// Handle type selection
	const handleTypeSelect = (type: 'port' | 'adapter' | 'service' | 'full') => {
		setSelectedType(type)
		setShowTypeSelector(false)

		// For adapter type, show port selector first
		if (type === 'adapter' && !options.name) {
			setShowPortSelector(true)
		} else if (!options.name) {
			setShowNameInput(true)
			if (type === 'full') {
				setNameInputStep('port')
			}
		}
	}

	// Handle port selection for adapter
	const handlePortSelect = (portInfo: PortInfo) => {
		setSelectedPortInfo(portInfo)
		setShowPortSelector(false)
		setShowNameInput(true)
	}

	// Handle going back from port selector to type selector
	const handlePortBack = () => {
		setShowPortSelector(false)
		setShowTypeSelector(true)
		setSelectedType(undefined)
	}

	// Handle left arrow key press for back navigation
	useInput((_input, key) => {
		if (key.leftArrow) {
			if (showPortSelector) {
				handlePortBack()
			} else if (showNameInput && !result && !error) {
				// Go back from name input
				if (selectedType === 'adapter') {
					setShowNameInput(false)
					setShowPortSelector(true)
				} else if (selectedType === 'full') {
					if (nameInputStep === 'adapter') {
						// Go back to port name input
						setNameInputStep('port')
						setAdapterName(undefined)
					} else {
						// Go back to type selector
						setShowNameInput(false)
						setShowTypeSelector(true)
						setSelectedType(undefined)
					}
				} else {
					// For port and service, go back to type selector
					setShowNameInput(false)
					setShowTypeSelector(true)
					setSelectedType(undefined)
				}
			}
		}
	})

	// Handle name input
	const handleNameInput = (name: string) => {
		// For 'full' type, we need two names: port and adapter
		if (selectedType === 'full') {
			if (nameInputStep === 'port') {
				setPortName(name)
				setNameInputStep('adapter')
			} else {
				setAdapterName(name)
				setShowNameInput(false)
			}
		} else {
			setSelectedName(name)
			setShowNameInput(false)
		}
	}

	// Load available ports when port selector is shown
	useEffect(() => {
		if (showPortSelector && !portsLoaded) {
			loadConfig().then((cfg) => {
				const ports = scanAvailablePorts(cfg)
				setAvailablePorts(ports)
				setPortsLoaded(true)
			})
		}
	}, [showPortSelector, portsLoaded])

	useEffect(() => {
		// Only start generation when we have required names
		if (!selectedType) {
			return
		}

		// For 'full' type, we need both port and adapter names
		if (selectedType === 'full') {
			if (!portName || !adapterName) {
				return
			}
		} else {
			// For other types, we need selectedName
			if (!selectedName) {
				return
			}
		}

		async function generate() {
			try {
				// Step 1: Load configuration
				setSteps([
					{
						id: 'config',
						label: 'Loading configuration',
						status: 'in_progress',
					},
				])

				const config = await loadConfig()

				setSteps((prev: ProgressStep[]) =>
					prev.map((s: ProgressStep) =>
						s.id === 'config' ? { ...s, status: 'completed' as const } : s,
					),
				)

				// Step 2: Generate files
				setSteps((prev: ProgressStep[]) => [
					...prev,
					{
						id: 'generate',
						label: 'Generating files',
						status: 'in_progress' as const,
					},
				])

				// TypeScript narrowing: we know these are defined from the condition above
				const type = selectedType

				let genResult: GeneratorResult

				// Handle 'full' type - generate both port and adapter
				if (type === 'full' && portName && adapterName) {
					// TypeScript now knows these are defined
					const port = portName
					const adapter = adapterName

					// Generate port first
					const portGenerator = new PortGenerator(config)
					const portResult = await portGenerator.generate({
						name: port,
						outputPath: options.outputPath,
						dryRun: options.dryRun,
					})

					// Generate adapter
					const adapterGenerator = new AdapterGenerator(config)
					const adapterResult = await adapterGenerator.generate({
						name: adapter,
						portName: port,
						outputPath: options.outputPath,
						dryRun: options.dryRun,
					})

					// Combine results
					genResult = {
						success: portResult.success && adapterResult.success,
						files: [
							...(portResult.files || []),
							...(adapterResult.files || []),
						],
						message:
							portResult.success && adapterResult.success
								? `Generated port '${port}' and adapter '${adapter}'`
								: 'Some files failed to generate',
					}
				} else if (selectedName) {
					// Handle single generator types
					// TypeScript now knows selectedName is defined
					const name = selectedName
					let generator: PortGenerator | AdapterGenerator | ServiceGenerator

					switch (type) {
						case 'port': {
							generator = new PortGenerator(config)
							const portOptions = {
								name,
								outputPath: options.outputPath,
								dryRun: options.dryRun,
							}
							genResult = await generator.generate(portOptions)
							break
						}
						case 'adapter': {
							generator = new AdapterGenerator(config)
							const adapterOptions = {
								name,
								portName: selectedPortInfo?.name || options.port,
								portPath: selectedPortInfo?.tokenImportPath,
								portTokenName: selectedPortInfo?.tokenName,
								outputPath: options.outputPath,
								dryRun: options.dryRun,
							}
							genResult = await generator.generate(adapterOptions)
							break
						}
						case 'service': {
							generator = new ServiceGenerator(config)
							const serviceOptions = {
								name,
								outputPath: options.outputPath,
								dryRun: options.dryRun,
							}
							genResult = await generator.generate(serviceOptions)
							break
						}
						default:
							throw new Error(`Unknown generator type: ${type}`)
					}
				} else {
					throw new Error(
						'Invalid state: selectedName is required for non-full generator types',
					)
				}

				setResult(genResult)

				setSteps((prev: ProgressStep[]) =>
					prev.map((s: ProgressStep) =>
						s.id === 'generate' ? { ...s, status: 'completed' as const } : s,
					),
				)

				// Step 3: Lint files (if not disabled and not in dry-run mode)
				if (!options.noLint && !options.dryRun && genResult.success) {
					setSteps((prev: ProgressStep[]) => [
						...prev,
						{
							id: 'lint',
							label: 'Linting files',
							status: 'in_progress' as const,
						},
					])

					const linterConfig = await detectLinter(process.cwd())

					if (linterConfig.type !== 'none' && genResult.files) {
						const lintResult = await runLinter(
							linterConfig,
							genResult.files,
							process.cwd(),
						)

						setSteps((prev: ProgressStep[]) =>
							prev.map((s: ProgressStep) =>
								s.id === 'lint'
									? {
											...s,
											status: lintResult.success
												? ('completed' as const)
												: ('failed' as const),
											message: lintResult.success
												? 'Passed'
												: 'Failed (see output)',
										}
									: s,
							),
						)
					} else {
						setSteps((prev: ProgressStep[]) =>
							prev.map((s: ProgressStep) =>
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
			} catch (err) {
				setError(err instanceof Error ? err : new Error(String(err)))
				setSteps((prev: ProgressStep[]) =>
					prev.map((s: ProgressStep) =>
						s.status === 'in_progress'
							? { ...s, status: 'failed' as const }
							: s,
					),
				)
			}
		}

		generate()
	}, [
		selectedType,
		selectedName,
		portName,
		adapterName,
		options,
		selectedPortInfo?.name,
		selectedPortInfo?.tokenImportPath,
		selectedPortInfo?.tokenName,
	])

	// Show type selector if type not provided
	if (showTypeSelector) {
		return <TypeSelector onSubmit={handleTypeSelect} />
	}

	// Show port selector for adapter type
	if (showPortSelector && selectedType === 'adapter') {
		if (!portsLoaded) {
			return <Text>Loading available ports...</Text>
		}

		return (
			<PortSelector
				ports={availablePorts}
				onSubmit={handlePortSelect}
				onBack={handlePortBack}
			/>
		)
	}

	// Show name input if name not provided
	if (showNameInput && selectedType) {
		return (
			<NameInput
				type={selectedType}
				step={selectedType === 'full' ? nameInputStep : undefined}
				onSubmit={handleNameInput}
			/>
		)
	}

	if (error) {
		return (
			<Box flexDirection="column">
				<Text color="red" bold>
					❌ Generation failed
				</Text>
				<Text color="red">{error.message}</Text>
			</Box>
		)
	}

	// Get display title based on type
	const getTitle = () => {
		if (!selectedType) return 'Generating...'

		if (selectedType === 'full') {
			if (portName && adapterName) {
				return `Generating port '${portName}' and adapter '${adapterName}'`
			}
			return 'Generating full module'
		}

		return `Generating ${selectedType}: ${selectedName || ''}`
	}

	if (
		result &&
		selectedType &&
		(selectedType === 'full' ? portName && adapterName : selectedName)
	) {
		return (
			<Box flexDirection="column">
				<ProgressIndicator steps={steps} title={getTitle()} />
				<Summary
					success={result.success}
					filesGenerated={result.files?.length || 0}
					totalFiles={result.files?.length || 0}
					outputPath={options.outputPath}
					files={result.files}
					tips={[
						'Import generated files in your modules',
						selectedType === 'port' && selectedName
							? 'Generate an adapter with: npx nest-hex generate adapter <name> --port ' +
								selectedName
							: undefined,
					].filter((t): t is string => t !== undefined)}
				/>
			</Box>
		)
	}

	return <ProgressIndicator steps={steps} title={getTitle()} />
}

/**
 * Execute generation command
 */
export async function generateCommand(
	options: GenerateCommandOptions,
): Promise<void> {
	// Check if we're in an interactive terminal
	const isInteractive =
		process.stdin.isTTY && typeof process.stdin.setRawMode === 'function'

	// If not interactive and missing required arguments, show error and usage
	const missingArgs =
		!options.type ||
		(options.type === 'full'
			? !options.portName || !options.adapterName
			: !options.name)

	if (!isInteractive && missingArgs) {
		console.error(
			'Error: Interactive mode is not supported in this environment.',
		)
		console.error('')
		console.error('Usage:')
		console.error('  nest-hex generate <type> <name>')
		console.error('  nest-hex generate full <portName> <adapterName>')
		console.error('')
		console.error('Types:')
		console.error(
			'  port     - Create domain capability (token, interface, service, module)',
		)
		console.error(
			'  adapter  - Create infrastructure implementation for a port',
		)
		console.error('  service  - Create service with @InjectPort usage')
		console.error('  full     - Generate both port and adapter together')
		console.error('')
		console.error('Examples:')
		console.error('  nest-hex generate port ObjectStorage')
		console.error('  nest-hex generate adapter S3 --port ObjectStorage')
		console.error('  nest-hex generate full ObjectStorage S3')
		process.exit(1)
	}

	const { waitUntilExit } = render(<GenerateUI options={options} />)
	await waitUntilExit()
}
