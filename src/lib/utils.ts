import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

export function currency(value: number | string, currencyCode = 'USD') {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currencyCode || 'USD',
		currencyDisplay: 'code',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(value || 0));
}

export function formatDate(dateString: string) {
	return new Intl.DateTimeFormat('en-NG', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(dateString));
}
