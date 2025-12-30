/**
 * Name Input Component
 *
 * Interactive name input using TextInput from @inkjs/ui.
 */

import { TextInput } from '@inkjs/ui'
import { Box, Text } from 'ink'

export interface NameInputProps {
	type: 'port' | 'adapter' | 'service' | 'full'
	step?: 'port' | 'adapter' // For 'full' type, which name we're asking for
	onSubmit: (name: string) => void
}

/**
 * Name input for component generation.
 */
export function NameInput({
	type,
	step,
	onSubmit,
}: NameInputProps): JSX.Element {
	// For 'full' type, show different prompts based on the step
	if (type === 'full') {
		const currentStep = step || 'port'
		const labels = {
			port: 'Enter the PORT name',
			adapter: 'Enter the ADAPTER name',
		}
		const placeholders = {
			port: 'e.g., ObjectStorage, CurrencyRates',
			adapter: 'e.g., S3, HttpRates',
		}

		return (
			<Box flexDirection="column" padding={1}>
				<Box marginBottom={1}>
					<Text bold color="cyan">
						{labels[currentStep]}:
					</Text>
				</Box>

				<TextInput
					placeholder={placeholders[currentStep]}
					onSubmit={(value) => {
						if (value.trim()) {
							onSubmit(value.trim())
						}
					}}
				/>

				<Box marginTop={1}>
					<Text dimColor>Press ← to go back</Text>
				</Box>
			</Box>
		)
	}

	// For other types, show single input
	const placeholders = {
		port: 'e.g., ObjectStorage, CurrencyRates',
		adapter: 'e.g., S3, HttpRates',
		service: 'e.g., FileUpload, UserRegistration',
		full: '', // Not used since we handle full type above
	}

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Enter the name for your {type}:
				</Text>
			</Box>

			<TextInput
				placeholder={placeholders[type]}
				onSubmit={(value) => {
					if (value.trim()) {
						onSubmit(value.trim())
					}
				}}
			/>

			<Box marginTop={1}>
				<Text dimColor>
					Press ← to go back
					{type === 'adapter' && ' to port selection'}
				</Text>
			</Box>
		</Box>
	)
}
