/**
 * Hook for managing generation form state and navigation
 */

import { useState } from 'react'
import type { PortInfo } from '../../utils/port-scanner'

interface GenerateFormOptions {
	type?: 'port' | 'adapter' | 'service' | 'full'
	name?: string
	portName?: string
	adapterName?: string
}

export interface GenerationFormState {
	selectedType: 'port' | 'adapter' | 'service' | 'full' | undefined
	selectedName: string | undefined
	portName: string | undefined
	adapterName: string | undefined
	selectedPortInfo: PortInfo | null
	showTypeSelector: boolean
	showPortSelector: boolean
	showNameInput: boolean
	nameInputStep: 'port' | 'adapter'
}

export interface GenerationFormActions {
	handleTypeSelect: (type: 'port' | 'adapter' | 'service' | 'full') => void
	handlePortSelect: (portInfo: PortInfo) => void
	handlePortBack: () => void
	handleNameInput: (name: string) => void
	navigateBack: () => void
}

export function useGenerationForm(
	options: GenerateFormOptions,
): GenerationFormState & GenerationFormActions {
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
	const [showTypeSelector, setShowTypeSelector] = useState(!options.type)
	const [showPortSelector, setShowPortSelector] = useState(false)
	const [showNameInput, setShowNameInput] = useState(() => {
		if (!options.type) return false
		if (options.type === 'full') {
			return !options.portName || !options.adapterName
		}
		return !options.name
	})
	const [nameInputStep, setNameInputStep] = useState<'port' | 'adapter'>(() => {
		if (options.type === 'full' && options.portName && !options.adapterName) {
			return 'adapter'
		}
		return 'port'
	})

	const handleTypeSelect = (type: 'port' | 'adapter' | 'service' | 'full') => {
		setSelectedType(type)
		setShowTypeSelector(false)

		if (type === 'adapter' && !options.name) {
			setShowPortSelector(true)
		} else if (!options.name) {
			setShowNameInput(true)
			if (type === 'full') {
				setNameInputStep('port')
			}
		}
	}

	const handlePortSelect = (portInfo: PortInfo) => {
		setSelectedPortInfo(portInfo)
		setShowPortSelector(false)
		setShowNameInput(true)
	}

	const handlePortBack = () => {
		setShowPortSelector(false)
		setShowTypeSelector(true)
		setSelectedType(undefined)
	}

	const handleNameInput = (name: string) => {
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

	const navigateBack = () => {
		if (showPortSelector) {
			handlePortBack()
		} else if (showNameInput) {
			if (selectedType === 'adapter') {
				setShowNameInput(false)
				setShowPortSelector(true)
			} else if (selectedType === 'full') {
				if (nameInputStep === 'adapter') {
					setNameInputStep('port')
					setAdapterName(undefined)
				} else {
					setShowNameInput(false)
					setShowTypeSelector(true)
					setSelectedType(undefined)
				}
			} else {
				setShowNameInput(false)
				setShowTypeSelector(true)
				setSelectedType(undefined)
			}
		}
	}

	return {
		selectedType,
		selectedName,
		portName,
		adapterName,
		selectedPortInfo,
		showTypeSelector,
		showPortSelector,
		showNameInput,
		nameInputStep,
		handleTypeSelect,
		handlePortSelect,
		handlePortBack,
		handleNameInput,
		navigateBack,
	}
}
