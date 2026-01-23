/**
 * Generate Command
 *
 * Main command for generating ports, adapters, and services.
 */

import { Box, render, Text } from 'ink'
import {
	NameInput,
	PortSelector,
	ProgressIndicator,
	Summary,
	TypeSelector,
} from '../ui/components'
import {
	useGeneration,
	useGenerationForm,
	useKeyboardNavigation,
	usePortScanner,
} from './hooks'

interface GenerateCommandOptions {
	type?: 'port' | 'adapter' | 'service' | 'full'
	name?: string
	portName?: string
	adapterName?: string
	outputPath?: string
	dryRun?: boolean
	force?: boolean
	noLint?: boolean
	port?: string
}

/**
 * Main generation UI component
 */
function GenerateUI({ options }: { options: GenerateCommandOptions }) {
	const form = useGenerationForm({
		type: options.type,
		name: options.name,
		portName: options.portName,
		adapterName: options.adapterName,
	})

	const { availablePorts, isLoading: portsLoading } = usePortScanner(
		form.showPortSelector,
	)

	const generation = useGeneration({
		selectedType: form.selectedType,
		selectedName: form.selectedName,
		portName: form.portName,
		adapterName: form.adapterName,
		selectedPortInfo: form.selectedPortInfo,
		options: {
			outputPath: options.outputPath,
			dryRun: options.dryRun,
			noLint: options.noLint,
			port: options.port,
		},
	})

	const canNavigateBack =
		(form.showPortSelector || form.showNameInput) &&
		!generation.result &&
		!generation.error

	useKeyboardNavigation({
		canNavigateBack,
		onBack: form.navigateBack,
	})

	// Render type selector
	if (form.showTypeSelector) {
		return (
			<Box paddingY={1}>
				<TypeSelector onSubmit={form.handleTypeSelect} />
			</Box>
		)
	}

	// Render port selector for adapter type
	if (form.showPortSelector && form.selectedType === 'adapter') {
		if (portsLoading) {
			return (
				<Box paddingY={1}>
					<Text>Loading available ports...</Text>
				</Box>
			)
		}

		return (
			<Box paddingY={1}>
				<PortSelector
					ports={availablePorts}
					onSubmit={form.handlePortSelect}
					onBack={form.handlePortBack}
				/>
			</Box>
		)
	}

	// Render name input
	if (form.showNameInput && form.selectedType) {
		return (
			<Box paddingY={1}>
				<NameInput
					type={form.selectedType}
					step={form.selectedType === 'full' ? form.nameInputStep : undefined}
					portName={
						form.selectedType === 'full' && form.nameInputStep === 'adapter'
							? form.portName
							: undefined
					}
					onSubmit={form.handleNameInput}
				/>
			</Box>
		)
	}

	// Render error state
	if (generation.error) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text color="red" bold>
					{'\u274C'} Generation failed
				</Text>
				<Text color="red">{generation.error.message}</Text>
			</Box>
		)
	}

	// Render summary when generation is complete
	if (
		generation.result &&
		form.selectedType &&
		(form.selectedType === 'full'
			? form.portName && form.adapterName
			: form.selectedName)
	) {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Summary
					success={generation.result.success}
					filesGenerated={generation.result.files?.length || 0}
					totalFiles={generation.result.files?.length || 0}
					duration={generation.duration}
					outputPath={options.outputPath}
					files={
						form.selectedType === 'full' ? undefined : generation.result.files
					}
					portFiles={generation.portResultFiles}
					adapterFiles={generation.adapterResultFiles}
					tips={buildTips(form.selectedType, form.selectedName)}
					portName={getSummaryPortName(
						form.selectedType,
						form.portName,
						form.selectedName,
					)}
					adapterName={getSummaryAdapterName(
						form.selectedType,
						form.adapterName,
						form.selectedName,
					)}
					serviceName={
						form.selectedType === 'service' ? form.selectedName : undefined
					}
				/>
			</Box>
		)
	}

	// Render progress indicator
	return (
		<Box paddingY={1}>
			<ProgressIndicator
				steps={generation.steps}
				title={getTitle(
					form.selectedType,
					form.selectedName,
					form.portName,
					form.adapterName,
				)}
			/>
		</Box>
	)
}

function getTitle(
	selectedType: 'port' | 'adapter' | 'service' | 'full' | undefined,
	selectedName: string | undefined,
	portName: string | undefined,
	adapterName: string | undefined,
): string {
	if (!selectedType) return 'Generating...'

	if (selectedType === 'full') {
		if (portName && adapterName) {
			return `Generating port '${portName}' and adapter '${adapterName}'`
		}
		return 'Generating full module'
	}

	return `Generating ${selectedType}: ${selectedName || ''}`
}

function getSummaryPortName(
	selectedType: 'port' | 'adapter' | 'service' | 'full',
	portName: string | undefined,
	selectedName: string | undefined,
): string | undefined {
	if (selectedType === 'full') return portName
	if (selectedType === 'port') return selectedName
	return undefined
}

function getSummaryAdapterName(
	selectedType: 'port' | 'adapter' | 'service' | 'full',
	adapterName: string | undefined,
	selectedName: string | undefined,
): string | undefined {
	if (selectedType === 'full') return adapterName
	if (selectedType === 'adapter') return selectedName
	return undefined
}

function buildTips(
	selectedType: 'port' | 'adapter' | 'service' | 'full',
	selectedName: string | undefined,
): string[] {
	const tips = ['Import generated files in your modules']

	if (selectedType === 'port' && selectedName) {
		tips.push(
			`Generate an adapter with: npx nest-hex generate adapter <name> --port ${selectedName}`,
		)
	}

	return tips
}

/**
 * Execute generation command
 */
export async function generateCommand(
	options: GenerateCommandOptions,
): Promise<void> {
	const isInteractive =
		process.stdin.isTTY && typeof process.stdin.setRawMode === 'function'

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
