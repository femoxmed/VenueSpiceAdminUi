import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { FileUpload } from '@/components/shared/file-upload';
import { UploadedImage } from '@/components/shared/uploaded-image';
import { useToast } from '@/components/shared/toast-provider';
import { useProduct, useUpdateProduct } from '@/features/products/hooks';
import {
	appendProductFormData,
	dateTimeInputValueToIso,
	emptyProductForm,
	isoToDateTimeInputValue,
	productToForm,
	slugifyProductName,
} from '@/features/products/form';
import {
	detailImageKey,
	ProductDetailFields,
	type ProductDetailImageField,
	type StagedProductDetailImages,
} from '@/features/products/detail-fields';
import {
	applyStagedDetailImages,
	deleteRemovedDetailImages,
} from '@/features/products/detail-image-submit';
import type { UploadStatusResponse } from '@/features/products/api';

export function ProductEditPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: product, isLoading } = useProduct(id ?? '');
	const updateProductMutation = useUpdateProduct();
	const { push } = useToast();

	const [form, setForm] = useState(emptyProductForm);

	const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
	const [mainImageFile, setMainImageFile] = useState<File | null>(null);
	const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);

	const [bannerPreview, setBannerPreview] = useState<string>('');
	const [mainPreview, setMainPreview] = useState<string>('');
	const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
	const [stagedDetailImages, setStagedDetailImages] =
		useState<StagedProductDetailImages>({});
	const [deletedDetailImages, setDeletedDetailImages] = useState<
		UploadStatusResponse[]
	>([]);

	const [existingBannerImage, setExistingBannerImage] = useState<any | null>(
		null,
	);
	const [existingMainImage, setExistingMainImage] = useState<any | null>(null);
	const [existingGalleryImages, setExistingGalleryImages] = useState<any[]>([]);

	const [deletedImages, setDeletedImages] = useState<any[]>([]);

	// Original state tracking for dirty check
	const [originalState, setOriginalState] = useState<{
		form: string;
		bannerImage: any | null;
		mainImage: any | null;
		galleryImages: any[];
	} | null>(null);

	// Initialize form when product loads
	useEffect(() => {
		if (product) {
			const nextForm = productToForm(product);
			setForm(nextForm);

			setExistingBannerImage(product.bannerImage || null);
			setExistingMainImage(product.mainImage || null);
			setExistingGalleryImages(product.galleryImages || []);
			setStagedDetailImages({});
			setDeletedDetailImages([]);

			// Save original state for dirty tracking
			setOriginalState({
				form: JSON.stringify(nextForm),
				bannerImage: product.bannerImage || null,
				mainImage: product.mainImage || null,
				galleryImages: product.galleryImages || [],
			});
		}
	}, [product]);

	const createPreview = (file: File): string => URL.createObjectURL(file);

	// Calculate if form has changes
	const hasChanges =
		originalState &&
		(JSON.stringify(form) !== originalState.form ||
			bannerImageFile !== null ||
			mainImageFile !== null ||
			galleryImageFiles.length > 0 ||
			existingBannerImage !== originalState.bannerImage ||
			existingMainImage !== originalState.mainImage ||
			JSON.stringify(existingGalleryImages) !==
				JSON.stringify(originalState.galleryImages) ||
			deletedImages.length > 0);
	const hasDetailImageChanges =
		Object.keys(stagedDetailImages).length > 0 || deletedDetailImages.length > 0;

	const handleBannerSelect = (file: File) => {
		// If replacing existing banner image, add old one to delete list
		if (existingBannerImage) {
			setDeletedImages((prev) => [
				...prev,
				{ ...existingBannerImage, type: 'banner' },
			]);
		}
		setBannerImageFile(file);
		setBannerPreview(createPreview(file));
		setExistingBannerImage(null);
	};

	const handleMainSelect = (file: File) => {
		// If replacing existing main image, add old one to delete list
		if (existingMainImage) {
			setDeletedImages((prev) => [
				...prev,
				{ ...existingMainImage, type: 'main' },
			]);
		}
		setMainImageFile(file);
		setMainPreview(createPreview(file));
		setExistingMainImage(null);
	};

	const handleGallerySelect = (file: File) => {
		setGalleryImageFiles((prev) => [...prev, file]);
		setGalleryPreviews((prev) => [...prev, createPreview(file)]);
	};

	const removeBannerImage = () => {
		if (existingBannerImage) {
			setDeletedImages((prev) => [
				...prev,
				{ ...existingBannerImage, type: 'banner' },
			]);
		}
		setBannerImageFile(null);
		setBannerPreview('');
		setExistingBannerImage(null);
	};

	const removeMainImage = () => {
		if (existingMainImage) {
			setDeletedImages((prev) => [
				...prev,
				{ ...existingMainImage, type: 'main' },
			]);
		}
		setMainImageFile(null);
		setMainPreview('');
		setExistingMainImage(null);
	};

	const removeGalleryImage = (index: number, isExisting: boolean = false) => {
		if (isExisting) {
			const deletedImage = existingGalleryImages[index];
			if (deletedImage) {
				setDeletedImages((prev) => [
					...prev,
					{ ...deletedImage, type: 'gallery' },
				]);
			}
			setExistingGalleryImages((prev) => prev.filter((_, i) => i !== index));
		} else {
			setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
			setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
		}
	};

	const handleDetailImageSelect = (
		field: ProductDetailImageField,
		index: number,
		file: File,
		previewUrl: string,
	) => {
		setStagedDetailImages((current) => ({
			...current,
			[detailImageKey(field, index)]: { file, previewUrl },
		}));
	};

	const handleDetailImageRemove = (
		field: ProductDetailImageField,
		index: number,
		image?: UploadStatusResponse,
	) => {
		if (image?.key) {
			setDeletedDetailImages((current) => [...current, image]);
		}
		setStagedDetailImages((current) => {
			const next = { ...current };
			delete next[detailImageKey(field, index)];
			return next;
		});
	};

	const handleSubmit = async () => {
		try {
			const formWithDetailImages = await applyStagedDetailImages(
				form,
				stagedDetailImages,
			);
			const formData = new FormData();
			appendProductFormData(formData, formWithDetailImages);

			if (bannerImageFile) {
				formData.append('bannerImage', bannerImageFile);
			}

			if (mainImageFile) {
				formData.append('mainImage', mainImageFile);
			}

			galleryImageFiles.forEach((file) => {
				formData.append('galleryImages', file);
			});

			// Add deleted images ids array as JSON
			if (deletedImages.length > 0) {
				formData.append('deletedImages', JSON.stringify(deletedImages));
			}

			await updateProductMutation.mutateAsync({
				productId: id ?? '',
				payload: formData,
			});

			await deleteRemovedDetailImages(deletedDetailImages);

			push({
				title: 'Product updated',
				description: 'Product details have been updated successfully.',
			});

			navigate(`/products/${id}`);
		} catch (error) {
			push({
				title: 'Unable to update product',
				description:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred.',
				variant: 'error',
			});
		}
	};

	if (isLoading) {
		return (
			<section className='space-y-6'>
				<PageHeader title='Loading product...' description='Please wait' />
			</section>
		);
	}

	if (!product) {
		return (
			<section className='space-y-6'>
				<PageHeader
					title='Product not found'
					description='The requested product does not exist'
				/>
			</section>
		);
	}

	return (
		<section className='space-y-6'>
			<PageHeader
				title={`Edit ${product.name}`}
				description={`SKU: ${product.sku}`}
			/>

			<div className='grid gap-4 md:grid-cols-2'>
				<input
					className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='Product name'
					value={form.name}
					onChange={(event) => {
						const name = event.target.value;
						setForm((current) => ({
							...current,
							name,
							slug: current.slug ? current.slug : slugifyProductName(name),
						}));
					}}
				/>
				<input
					className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='Slug'
					value={form.slug}
					onChange={(event) =>
						setForm((current) => ({ ...current, slug: event.target.value }))
					}
				/>
				<input
					className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='SKU'
					value={form.sku}
					onChange={(event) =>
						setForm((current) => ({ ...current, sku: event.target.value }))
					}
				/>
				<input
					className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='Price'
					value={form.price}
					onChange={(event) =>
						setForm((current) => ({ ...current, price: event.target.value }))
					}
				/>
				<input
					className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='Stock'
					value={form.stock}
					onChange={(event) =>
						setForm((current) => ({ ...current, stock: event.target.value }))
					}
				/>
				<input
					className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='Starting price label'
					value={form.startingPriceLabel}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							startingPriceLabel: event.target.value,
						}))
					}
				/>
				<select
					className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					value={form.status}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							status: event.target.value as typeof current.status,
						}))
					}>
					<option value='draft'>Draft</option>
					<option value='active'>Active</option>
					<option value='archived'>Archived</option>
				</select>
				<input
					className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
					placeholder='Sort order'
					value={form.sortOrder}
					onChange={(event) =>
						setForm((current) => ({ ...current, sortOrder: event.target.value }))
					}
				/>
				<label className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
					Featured at
					<input
						type='datetime-local'
						className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900'
						value={isoToDateTimeInputValue(form.featuredAt)}
						onChange={(event) =>
							setForm((current) => ({
								...current,
								featuredAt: dateTimeInputValueToIso(event.target.value),
							}))
						}
					/>
				</label>
				<textarea
					className='min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2'
					placeholder='Short description'
					value={form.shortDescription}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							shortDescription: event.target.value,
						}))
					}
				/>
				<textarea
					className='min-h-32 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2'
					placeholder='Full product description'
					value={form.description}
					onChange={(event) =>
						setForm((current) => ({
							...current,
							description: event.target.value,
						}))
					}
				/>
				<ProductDetailFields
					form={form}
					setForm={setForm}
					stagedImages={stagedDetailImages}
					onImageSelect={handleDetailImageSelect}
					onImageRemove={handleDetailImageRemove}
				/>

				<div className='md:col-span-2 space-y-4 mt-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Banner Image
						</label>
						{existingBannerImage || bannerPreview ? (
							<UploadedImage
								url={existingBannerImage?.url || bannerPreview}
								onDelete={removeBannerImage}
							/>
						) : (
							<FileUpload
								onFileSelect={handleBannerSelect}
								label='Upload Banner Image'
								maxSizeMB={5}
								immediate={false}
							/>
						)}
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Main Product Image
						</label>
						{existingMainImage || mainPreview ? (
							<UploadedImage
								url={existingMainImage?.url || mainPreview}
								onDelete={removeMainImage}
							/>
						) : (
							<FileUpload
								onFileSelect={handleMainSelect}
								label='Upload Main Image'
								maxSizeMB={5}
								immediate={false}
							/>
						)}
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Gallery Images
						</label>
						<div className='grid grid-cols-4 gap-4 mb-4'>
							{existingGalleryImages.map((image, idx) => (
								<UploadedImage
									key={`existing-${idx}`}
									url={image.url}
									size='sm'
									onDelete={() => removeGalleryImage(idx, true)}
								/>
							))}
							{galleryPreviews.map((preview, idx) => (
								<UploadedImage
									key={`new-${idx}`}
									url={preview}
									size='sm'
									onDelete={() => removeGalleryImage(idx, false)}
								/>
							))}
						</div>
						<FileUpload
							onFileSelect={handleGallerySelect}
							label='Add Gallery Image'
							maxSizeMB={5}
							immediate={false}
						/>
					</div>
				</div>
			</div>

			<div className='flex gap-4 mt-6'>
				<button
					className='flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm'
					onClick={() => navigate(`/products/${id}`)}>
					Cancel
				</button>
				<button
					className='flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white'
					disabled={
						updateProductMutation.isPending ||
						(!hasChanges && !hasDetailImageChanges)
					}
					onClick={handleSubmit}>
					{updateProductMutation.isPending ? 'Saving...' : 'Save changes'}
				</button>
			</div>
		</section>
	);
}
