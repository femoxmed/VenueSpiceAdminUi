import { apiClient } from '@/lib/api-client';

export type PricingSettings = {
	venueSpiceFeePercent: number;
	venueSpiceFeeFixed: number;
	paymentProcessingFeePercent: number;
	paymentProcessingFeeFixed: number;
	organizerPayoutHoldDays: number;
	defaultFeePayer: 'buyer' | 'organizer';
	stripeAutomaticTaxEnabled: boolean;
	stripeTaxCode: string;
	stripeTaxBehavior: 'exclusive' | 'inclusive' | 'unspecified';
};

export type PlatformSetting = {
	key: string;
	value: string;
	valueType: 'string' | 'number' | 'boolean';
	description?: string | null;
	updatedBy?: string | null;
	createdAt: string;
	updatedAt: string;
};

export function getPlatformSettings() {
	return apiClient<{ data: PlatformSetting[]; pricing: PricingSettings }>('/platform-settings');
}

export function updatePricingSettings(payload: PricingSettings) {
	return apiClient<PricingSettings>('/platform-settings/pricing', {
		method: 'PATCH',
		body: JSON.stringify(payload),
	});
}
