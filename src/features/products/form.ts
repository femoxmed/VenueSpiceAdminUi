import type { ProductRow, ProductStatus } from './api';
import { currency } from '@/lib/utils';

export type ProductFormState = {
	name: string;
	slug: string;
	sku: string;
	price: string;
	stock: string;
	shortDescription: string;
	description: string;
	startingPriceLabel: string;
	colors: string;
	features: string;
	specifications: string;
	boxItems: string;
	addOns: string;
	status: ProductStatus;
	featuredAt: string;
	sortOrder: string;
};

export const emptyProductForm: ProductFormState = {
	name: '',
	slug: '',
	sku: '',
	price: '',
	stock: '',
	shortDescription: '',
	description: '',
	startingPriceLabel: '',
	colors: '[{"id":"charcoal","label":"Charcoal Black","value":"#101818"}]',
	features: '[]',
	specifications: '[]',
	boxItems: '[]',
	addOns: '[]',
	status: 'draft',
	featuredAt: '',
	sortOrder: '0',
};

export function slugifyProductName(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '');
}

export function isoToDateTimeInputValue(value?: string | null) {
	if (!value) return '';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return offsetDate.toISOString().slice(0, 16);
}

export function dateTimeInputValueToIso(value: string) {
	if (!value) return '';

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function productToForm(product: ProductRow): ProductFormState {
	return {
		name: product.name,
		slug: product.slug || slugifyProductName(product.name),
		sku: product.sku,
		price: String(product.price),
		stock: String(product.stock),
		shortDescription: product.shortDescription || '',
		description: product.description || '',
		startingPriceLabel:
			product.startingPriceLabel || `Starting From ${currency(Number(product.price))}`,
		colors: JSON.stringify(product.colors || [], null, 2),
		features: JSON.stringify(product.features || [], null, 2),
		specifications: JSON.stringify(product.specifications || [], null, 2),
		boxItems: JSON.stringify(product.boxItems || [], null, 2),
		addOns: JSON.stringify(product.addOns || [], null, 2),
		status: product.status || 'draft',
		featuredAt: product.featuredAt || '',
		sortOrder: String(product.sortOrder ?? 0),
	};
}

export function appendProductFormData(formData: FormData, form: ProductFormState) {
	formData.append('name', form.name.trim());
	formData.append('slug', slugifyProductName(form.slug || form.name));
	formData.append('sku', form.sku.trim());
	formData.append('price', String(Number(form.price)));
	formData.append('stock', String(Number(form.stock)));
	formData.append('shortDescription', form.shortDescription.trim());
	formData.append('description', form.description.trim());
	formData.append('startingPriceLabel', form.startingPriceLabel.trim());
	formData.append('colors', normalizeJsonArray(form.colors, 'Colors'));
	formData.append('features', normalizeJsonArray(form.features, 'Features'));
	formData.append(
		'specifications',
		normalizeJsonArray(form.specifications, 'Specifications'),
	);
	formData.append('boxItems', normalizeJsonArray(form.boxItems, 'Box items'));
	formData.append('addOns', normalizeJsonArray(form.addOns, 'Add-ons'));
	formData.append('status', form.status);
	formData.append('featuredAt', form.featuredAt);
	formData.append('sortOrder', String(Number(form.sortOrder || 0)));
}

function normalizeJsonArray(value: string, label: string) {
	const parsed = JSON.parse(value || '[]');

	if (!Array.isArray(parsed)) {
		throw new Error(`${label} must be a JSON array`);
	}

	return JSON.stringify(parsed);
}
