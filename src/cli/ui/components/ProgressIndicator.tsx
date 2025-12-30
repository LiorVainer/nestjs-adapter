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
		<Box flexDirection="column" paddingY={1}>
			{title && (
				<Box marginBottom={1}>
					<Text bold>{title}</Text>
				</Box>
			)}

			{steps.map((step) => (
				<Box key={step.id} flexDirection="row" gap={1}>
					{step.status === 'in_progress' && <Spinner type="dots" />}
					{step.status === 'completed' && <Text color="green">✓</Text>}
					{step.status === 'failed' && <Text color="red">✗</Text>}
					{step.status === 'pending' && <Text dimColor>○</Text>}

					<Text
						color={
							step.status === 'completed'
								? 'green'
								: step.status === 'failed'
									? 'red'
									: step.status === 'in_progress'
										? 'cyan'
										: 'gray'
						}
					>
						{step.label}
					</Text>

					{step.message && <Text dimColor> - {step.message}</Text>}
				</Box>
			))}
		</Box>
	)
}
