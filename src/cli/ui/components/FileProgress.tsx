/**
 * File Progress Component
 *
 * Shows progress for individual file generation.
 */

import { Box, Text } from 'ink'

export interface FileProgressProps {
	fileName: string
	status: 'pending' | 'generating' | 'completed' | 'skipped' | 'failed'
	error?: string
}

/**
 * Shows progress for a single file generation.
 */
export function FileProgress({
	fileName,
	status,
	error,
}: FileProgressProps): JSX.Element {
	const getStatusIcon = () => {
		switch (status) {
			case 'completed':
				return <Text color="green">✓</Text>
			case 'failed':
				return <Text color="red">✗</Text>
			case 'skipped':
				return <Text color="yellow">○</Text>
			case 'generating':
				return <Text color="cyan">●</Text>
			case 'pending':
				return <Text dimColor>○</Text>
		}
	}

	const getStatusColor = () => {
		switch (status) {
			case 'completed':
				return 'green'
			case 'failed':
				return 'red'
			case 'skipped':
				return 'yellow'
			case 'generating':
				return 'cyan'
			case 'pending':
				return 'gray'
		}
	}

	return (
		<Box flexDirection="column">
			<Box flexDirection="row" gap={1}>
				{getStatusIcon()}
				<Text color={getStatusColor()}>{fileName}</Text>
			</Box>
			{error && (
				<Box marginLeft={2}>
					<Text color="red">Error: {error}</Text>
				</Box>
			)}
		</Box>
	)
}
