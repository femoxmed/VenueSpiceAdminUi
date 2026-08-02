import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlatformSettings, updatePricingSettings, type PricingSettings } from './api';

export function usePlatformSettings() {
	return useQuery({
		queryKey: ['platform-settings'],
		queryFn: getPlatformSettings,
	});
}

export function useUpdatePricingSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: PricingSettings) => updatePricingSettings(payload),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
		},
	});
}
