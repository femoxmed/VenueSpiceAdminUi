import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { FileUpload } from '@/components/shared/file-upload';
import { UploadedImage } from '@/components/shared/uploaded-image';
import { useToast } from '@/components/shared/toast-provider';
import {
	detailImageKey,
	ProductDetailFields,
	type ProductDetailImageField,
	type StagedProductDetailImages,
} from '@/features/products/detail-fields';
import { applyStagedDetailImages } from '@/features/products/detail-image-submit';
import { useCreateProduct } from '@/features/products/hooks';
import {
	appendProductFormData,
	dateTimeInputValueToIso,
	emptyProductForm,
	isoToDateTimeInputValue,
	slugifyProductName,
} from '@/features/products/form';

export function ProductCreatePage() {
	const navigate = useNavigate();
	const createProductMutation = useCreateProduct();
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

	const createPreview = (file: File): string => URL.createObjectURL(file);

	const handleBannerSelect = (file: File) => {
		setBannerImageFile(file);
		setBannerPreview(createPreview(file));
	};

	const handleMainSelect = (file: File) => {
		setMainImageFile(file);
		setMainPreview(createPreview(file));
	};

	const handleGallerySelect = (file: File) => {
		setGalleryImageFiles((prev) => [...prev, file]);
		setGalleryPreviews((prev) => [...prev, createPreview(file)]);
	};

	const removeGalleryImage = (index: number) => {
		setGalleryImageFiles((prev) => prev.filter((_, i) => i !== index));
		setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
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
	) => {
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

			const product = await createProductMutation.mutateAsync(formData);

			push({
				title: 'Product created',
				description: 'The catalogue has been updated successfully.',
			});

			navigate(`/products/${product.id}`);
		} catch (error) {
			push({
				title: 'Unable to create product',
				description:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred.',
				variant: 'error',
			});
		}
	};

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Create product'
				description='Add a product with catalogue, detail page, and inventory data.'
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

				<div className='space-y-4 md:col-span-2'>
					<div>
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Banner Image
						</label>
						{bannerPreview ? (
							<UploadedImage
								url={bannerPreview}
								onDelete={() => {
									setBannerImageFile(null);
									setBannerPreview('');
								}}
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
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Main Product Image
						</label>
						{mainPreview ? (
							<UploadedImage
								url={mainPreview}
								onDelete={() => {
									setMainImageFile(null);
									setMainPreview('');
								}}
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
						<label className='mb-2 block text-sm font-medium text-gray-700'>
							Gallery Images
						</label>
						<div className='mb-4 grid grid-cols-4 gap-4'>
							{galleryPreviews.map((preview, idx) => (
								<UploadedImage
									key={preview}
									url={preview}
									size='sm'
									onDelete={() => removeGalleryImage(idx)}
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

			<div className='mt-6 flex gap-4'>
				<button
					className='flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm'
					onClick={() => navigate('/products')}>
					Cancel
				</button>
				<button
					className='flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white'
					disabled={createProductMutation.isPending}
					onClick={handleSubmit}>
					{createProductMutation.isPending ? 'Creating...' : 'Create product'}
				</button>
			</div>
		</section>
	);
}
