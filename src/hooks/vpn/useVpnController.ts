import { useEffect, useState } from 'react';
import type { Category } from '../../types';
import type { VpnContextType } from '../../context/types';
import { useCredentialsState } from './useCredentialsState';
import { useTermsState } from './useTermsState';
import { useNavigationState } from './useNavigationState';
import { useVpnConnectionState } from './useVpnConnectionState';
import { useVpnUserState } from './useVpnUserState';
import { loadAutoMode, saveAutoMode } from '../../utils/storageUtils';

export function useVpnController(): VpnContextType {
	const { creds, setCreds, persistCreds } = useCredentialsState();
	const { termsAccepted, acceptTerms } = useTermsState();
	const { screen, setScreen } = useNavigationState(termsAccepted);
	const connection = useVpnConnectionState({ creds, persistCreds, setScreen });
	const userState = useVpnUserState({ status: connection.status, config: connection.config, creds });
	const [autoMode, setAutoModeState] = useState(loadAutoMode());
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

	useEffect(() => {
		if (screen !== 'servers' && selectedCategory) {
			setSelectedCategory(null);
		}
	}, [screen, selectedCategory]);

	const setAutoMode = (on: boolean) => {
		setAutoModeState(on);
		saveAutoMode(on);
	};

	return {
		status: connection.status,
		config: connection.config,
		categorias: connection.categorias,
		selectedCategory,
		user: userState.user,
		creds,
		auto: connection.auto,
		screen,
		termsAccepted,
		needsUpdate: connection.needsUpdate,
		autoMode,
		setScreen,
		setConfig: connection.setConfig,
		setCreds,
		setSelectedCategory,
		setAutoMode,
		connect: connection.connect,
		disconnect: connection.disconnect,
		cancelConnecting: connection.cancelConnecting,
		startAutoConnect: connection.startAutoConnect,
		loadCategorias: connection.loadCategorias,
		acceptTerms,
		topInfo: userState.topInfo,
		pingMs: userState.pingMs,
	};
}
