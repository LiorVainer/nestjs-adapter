/**
 * Progress Indicator Component
 *
 * Shows real-time progress during file generation with spinners and status messages.
 */

import { Spinner } from '@inkjs/ui'
import { Box, Text } from 'ink'

export interface ProgressStep {
	id: string
	label: string
	status: 'pending' | 'in_progress' | 'completed' | 'failed'
	message?: string
}

export interface ProgressIndicatorProps {
	steps: ProgressStep[]
	title?: string
}

/**
 * Progress indicator that shows current step with spinner.
 */
export function ProgressIndicator({
	steps,
	title,
}: ProgressIndicatorProps): JSX.Element {
	return (
		<Box flexDirection="column">
			{title && (
				<Box marginBottom={1}>
					<Text bold>{title}</Text>
				</Box>
			)}

			{steps.map((step) => (
				<Box key={step.id} flexDirection="row" gap={1}>
					{step.status === 'in_progress' && (
						<>
							<Spinner label={step.label} />
							{step.message && <Text dimColor> - {step.message}</Text>}
						</>
					)}
					{step.status === 'completed' && (
						<>
							<Text color="green">✓</Text>
							<Text color="green">{step.label}</Text>
							{step.message && <Text dimColor> - {step.message}</Text>}
						</>
					)}
					{step.status === 'failed' && (
						<>
							<Text color="red">✗</Text>
							<Text color="red">{step.label}</Text>
							{step.message && <Text dimColor> - {step.message}</Text>}
						</>
					)}
					{step.status === 'pending' && (
						<>
							<Text dimColor>○</Text>
							<Text color="gray">{step.label}</Text>
							{step.message && <Text dimColor> - {step.message}</Text>}
						</>
					)}
				</Box>
			))}
		</Box>
	)
}
