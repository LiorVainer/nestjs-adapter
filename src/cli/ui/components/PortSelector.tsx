/**
 * Port Selector Component
 *
 * Interactive port selection for adapter generation.
 * Requires a port to be selected - adapters must implement a port interface.
 */

import { Select } from '@inkjs/ui'
import { Box, Text } from 'ink'
import type { PortInfo } from '../../utils/port-scanner'

export interface PortSelectorProps {
	ports: PortInfo[]
	onSubmit: (portInfo: PortInfo) => void
	onBack?: () => void
}

/**
 * Displays a list of available ports and allows the user to select one
 */
export function PortSelector({
	ports,
	onSubmit,
}: PortSelectorProps): JSX.Element {
	if (ports.length === 0) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="yellow" bold>
					⚠ No ports found
				</Text>
				<Box marginTop={1}>
					<Text>You must create a port before generating an adapter.</Text>
				</Box>
				<Box marginTop={1}>
					<Text dimColor>Generate a port first:</Text>
					<Text color="cyan"> nest-hex generate port</Text>
				</Box>
				<Box marginTop={1}>
					<Text dimColor>Press ← to go back</Text>
				</Box>
			</Box>
		)
	}

	const options = ports.map((port) => ({
		label: port.pascalName,
		value: port.name,
	}))

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold>Select Port to Implement</Text>
			</Box>

			<Select
				options={options}
				onChange={(selectedValue) => {
					const selectedPort = ports.find((p) => p.name === selectedValue)
					if (selectedPort) {
						onSubmit(selectedPort)
					}
				}}
			/>

			<Box marginTop={1} flexDirection="column">
				<Text dimColor>
					This adapter will implement the selected port interface
				</Text>
				<Text dimColor>Press ← to go back to type selection</Text>
			</Box>
		</Box>
	)
}
