import { apiClient } from '@/lib/api-client';

export type ProductRow = {
	id: string;
	name: string;
	slug?: string;
	sku: string;
	price: number;
	stock: number;
	shortDescription?: string | null;
	description?: string | null;
	startingPriceLabel?: string | null;
	colors?: ProductColor[] | null;
	features?: ProductFeature[] | null;
	specifications?: ProductSpecification[] | null;
	boxItems?: ProductBoxItem[] | null;
	addOns?: ProductAddOn[] | null;
	status?: ProductStatus;
	featuredAt?: string | null;
	sortOrder?: number;
	bannerImage?: any;
	mainImage?: any;
	galleryImages?: any[];
	createdAt?: string;
	updatedAt?: string;
};

export type ProductStatus = 'draft' | 'active' | 'archived';

export type ProductColor = {
	id: string;
	label: string;
	value: string;
	image?: UploadStatusResponse;
	imageUrl?: string;
};

export type ProductFeature = {
	title: string;
	titleLine2?: string;
	description: string;
	image?: UploadStatusResponse;
	imageUrl?: string;
	imageAlt?: string;
	imageClassName?: string;
};

export type ProductSpecification = {
	label: string;
	value: string;
};

export type ProductBoxItem = {
	title: string;
	image?: UploadStatusResponse;
	imageUrl?: string;
	description?: string;
	imageAlt?: string;
};

export type ProductAddOn = {
	productId: string;
	isCompulsory?: boolean;
};

export type CreateProductPayload = {
	name: string;
	slug?: string;
	sku: string;
	price: number;
	stock: number;
	shortDescription?: string;
	description?: string;
	startingPriceLabel?: string;
	colors?: ProductColor[];
	features?: ProductFeature[];
	specifications?: ProductSpecification[];
	boxItems?: ProductBoxItem[];
	addOns?: ProductAddOn[];
	status?: ProductStatus;
	featuredAt?: string | null;
	sortOrder?: number;
	bannerImage?: string;
	mainImage?: string;
	galleryImages?: string[];
};

export type UploadFileResponse = {
	uploadId: string;
	status: string;
	message: string;
};

export type UploadStatusResponse = {
	id: string;
	key: string;
	originalName: string;
	mimeType: string;
	size: number;
	url?: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	errorMessage?: string;
	variants?: any[];
};

export function uploadFile(file: File) {
	const formData = new FormData();
	formData.append('file', file);

	return apiClient<UploadFileResponse>('/uploads', {
		method: 'POST',
		body: formData,
		headers: {
			// Do NOT set Content-Type header - browser will set it correctly with boundary
		},
	});
}

export function getUploadStatus(uploadId: string) {
	return apiClient<UploadStatusResponse>(`/uploads/${uploadId}/status`);
}

export async function uploadFileAndWait(file: File) {
	const result = await uploadFile(file);
	const maxAttempts = 30;

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 500 : 1000));
		const status = await getUploadStatus(result.uploadId);

		if (status.status === 'completed' && status.url) {
			return status;
		}

		if (status.status === 'failed') {
			throw new Error(status.errorMessage || 'Upload failed');
		}
	}

	throw new Error('Upload timed out');
}

export function deleteUploadedFile(
	key: string,
	deleteVariants: boolean = true,
) {
	return apiClient(
		`/uploads/${encodeURIComponent(key)}?deleteVariants=${deleteVariants}`,
		{
			method: 'DELETE',
		},
	);
}

export function deleteProductImage(
	productId: string,
	imageField: 'bannerImage' | 'mainImage' | 'galleryImages',
	imageIndex?: number,
) {
	const queryString = imageIndex !== undefined ? `?index=${imageIndex}` : '';
	return apiClient(
		`/products/${productId}/images/${imageField}${queryString}`,
		{
			method: 'DELETE',
		},
	);
}

export function getProducts() {
	return apiClient<ProductRow[]>('/products');
}

export function createProduct(payload: CreateProductPayload | FormData) {
	const isFormData = payload instanceof FormData;

	return apiClient<ProductRow>('/products', {
		method: 'POST',
		body: isFormData ? payload : JSON.stringify(payload),
		headers: isFormData
			? {}
			: {
					'Content-Type': 'application/json',
				},
	});
}

export function getProduct(productId: string) {
	return apiClient<ProductRow>(`/products/${productId}`);
}

export function updateProduct(
	productId: string,
	payload: Partial<CreateProductPayload> | FormData,
) {
	const isFormData = payload instanceof FormData;

	return apiClient<ProductRow>(`/products/${productId}`, {
		method: 'PATCH',
		body: isFormData ? payload : JSON.stringify(payload),
		headers: isFormData
			? {}
			: {
					'Content-Type': 'application/json',
		},
	});
}

export function deleteProduct(productId: string) {
	return apiClient<{ deleted: boolean; archived: boolean; id: string }>(
		`/products/${productId}`,
		{
			method: 'DELETE',
		},
	);
}
