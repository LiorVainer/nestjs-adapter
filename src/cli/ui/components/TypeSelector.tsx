/**
 * Type Selector Component
 *
 * Interactive component type selection using Select from @inkjs/ui.
 */

import { Select } from '@inkjs/ui'
import { Box, Text } from 'ink'
import React, { useState } from 'react'

export interface TypeSelectorProps {
	onSubmit: (type: 'port' | 'adapter' | 'service' | 'full') => void
}

/**
 * Component type selector (port, adapter, service, full).
 */
export function TypeSelector({ onSubmit }: TypeSelectorProps) {
	const [selectedType, setSelectedType] = useState<string | undefined>()

	const options = [
		{
			label:
				'Port - Create domain capability (token, interface, service, module)',
			value: 'port',
		},
		{
			label: 'Adapter - Create infrastructure implementation for a port',
			value: 'adapter',
		},
		{
			label: 'Service - Create service with @InjectPort usage',
			value: 'service',
		},
		{
			label: 'Full - Generate both port and adapter together',
			value: 'full',
		},
	]

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="cyan">
					What do you want to generate?
				</Text>
			</Box>

			<Select
				options={options}
				onChange={(value) => {
					setSelectedType(value)
					onSubmit(value as 'port' | 'adapter' | 'service' | 'full')
				}}
			/>
		</Box>
	)
}
