/**
 * Hook for scanning and loading available ports
 */

import { useEffect, useState } from 'react'
import { loadConfig } from '../../config/loader'
import type { PortInfo } from '../../utils/port-scanner'
import { scanAvailablePorts } from '../../utils/port-scanner'

interface UsePortScannerResult {
	availablePorts: PortInfo[]
	isLoading: boolean
}

export function usePortScanner(shouldLoad: boolean): UsePortScannerResult {
	const [availablePorts, setAvailablePorts] = useState<PortInfo[]>([])
	const [hasLoaded, setHasLoaded] = useState(false)

	useEffect(() => {
		if (shouldLoad && !hasLoaded) {
			loadConfig().then((cfg) => {
				const ports = scanAvailablePorts(cfg)
				setAvailablePorts(ports)
				setHasLoaded(true)
			})
		}
	}, [shouldLoad, hasLoaded])

	return {
		availablePorts,
		isLoading: shouldLoad && !hasLoaded,
	}
}
