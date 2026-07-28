import type { Dispatch, SetStateAction } from 'react';
import { FileUpload } from '@/components/shared/file-upload';
import { UploadedImage } from '@/components/shared/uploaded-image';
import type { UploadStatusResponse } from './api';
import type { ProductFormState } from './form';

export type ProductDetailImageField = 'colors' | 'features' | 'boxItems';

export type StagedProductDetailImage = {
	file: File;
	previewUrl: string;
};

export type StagedProductDetailImages = Record<
	string,
	StagedProductDetailImage | undefined
>;

type DetailFieldsProps = {
	form: ProductFormState;
	setForm: Dispatch<SetStateAction<ProductFormState>>;
	stagedImages?: StagedProductDetailImages;
	onImageSelect?: (
		field: ProductDetailImageField,
		index: number,
		file: File,
		previewUrl: string,
	) => void;
	onImageRemove?: (
		field: ProductDetailImageField,
		index: number,
		image?: UploadStatusResponse,
	) => void;
};

type ColorField = {
	id: string;
	label: string;
	value: string;
	image?: UploadStatusResponse;
	imageUrl?: string;
};

type FeatureField = {
	title: string;
	titleLine2?: string;
	description: string;
	image?: UploadStatusResponse;
	imageUrl?: string;
	imageAlt?: string;
	imageClassName?: string;
};

type SpecificationField = {
	label: string;
	value: string;
};

type BoxItemField = {
	title: string;
	image?: UploadStatusResponse;
	imageUrl?: string;
	description?: string;
	imageAlt?: string;
};

const inputClass =
	'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';
const textareaClass =
	'min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';

export function ProductDetailFields({
	form,
	setForm,
	stagedImages = {},
	onImageSelect,
	onImageRemove,
}: DetailFieldsProps) {
	const colors = parseArray<ColorField>(form.colors);
	const features = parseArray<FeatureField>(form.features);
	const specifications = parseArray<SpecificationField>(form.specifications);
	const boxItems = parseArray<BoxItemField>(form.boxItems);
	const addOns = parseArray<{ productId: string; isCompulsory?: boolean }>(
		form.addOns,
	);

	const setJsonField = <Key extends keyof ProductFormState>(
		field: Key,
		value: unknown[],
	) => {
		setForm((current) => ({
			...current,
			[field]: JSON.stringify(value, null, 2),
		}));
	};

	const updateItem = <Item,>(
		field: keyof ProductFormState,
		items: Item[],
		index: number,
		nextItem: Item,
	) => {
		setJsonField(
			field,
			items.map((item, itemIndex) => (itemIndex === index ? nextItem : item)),
		);
	};

	const removeItem = <Item,>(
		field: keyof ProductFormState,
		items: Item[],
		index: number,
	) => {
		setJsonField(
			field,
			items.filter((_, itemIndex) => itemIndex !== index),
		);
	};

	return (
		<div className='space-y-6 md:col-span-2'>
			<SectionHeader title='Color variations' />
			<div className='space-y-3'>
				{colors.map((color, index) => (
					<div key={index} className='rounded-xl border border-slate-200 p-4'>
						<div className='grid gap-3 md:grid-cols-2'>
							<input
								className={inputClass}
								placeholder='Color id'
								value={color.id}
								onChange={(event) =>
									updateItem('colors', colors, index, {
										...color,
										id: event.target.value,
									})
								}
							/>
							<input
								className={inputClass}
								placeholder='Label'
								value={color.label}
								onChange={(event) =>
									updateItem('colors', colors, index, {
										...color,
										label: event.target.value,
									})
								}
							/>
							<div className='flex gap-2'>
								<input
									type='color'
									className='h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1'
									value={toColorInputValue(color.value)}
									onChange={(event) =>
										updateItem('colors', colors, index, {
											...color,
											value: event.target.value,
										})
									}
								/>
								<span
									className='h-10 w-10 rounded-full border border-slate-200'
									style={{ backgroundColor: color.value || '#ffffff' }}
								/>
								<input
									className={inputClass}
									placeholder='Hex value'
									value={color.value}
									onChange={(event) =>
										updateItem('colors', colors, index, {
											...color,
											value: event.target.value,
										})
									}
								/>
							</div>
							<div>
								{getStagedImageUrl(stagedImages, 'colors', index) ||
								getImageUrl(color) ? (
									<UploadedImage
										url={
											getStagedImageUrl(stagedImages, 'colors', index) ||
											getImageUrl(color)
										}
										size='sm'
										onDelete={() => {
											onImageRemove?.('colors', index, color.image);
											updateItem('colors', colors, index, {
												...color,
												image: undefined,
												imageUrl: '',
											});
										}}
									/>
								) : (
									<FileUpload
										label='Upload Variant Image'
										maxSizeMB={5}
										immediate={false}
										onFileSelect={(file, previewUrl) =>
											onImageSelect?.('colors', index, file, previewUrl)
										}
									/>
								)}
							</div>
						</div>
						<RowActions onRemove={() => removeItem('colors', colors, index)} />
					</div>
				))}
				<AddButton
					label='Add color'
					onClick={() =>
						setJsonField('colors', [
							...colors,
							{ id: '', label: '', value: '#ffffff' },
						])
					}
				/>
			</div>

			<SectionHeader title='Compatible add-ons' />
			<div className='space-y-3'>
				{addOns.map((addOn, index) => (
					<div key={index} className='rounded-xl border border-slate-200 p-4'>
						<div className='grid gap-3 md:grid-cols-[1fr_auto]'>
							<input
								className={inputClass}
								placeholder='Add-on product ID'
								value={addOn.productId}
								onChange={(event) =>
									updateItem('addOns', addOns, index, {
										...addOn,
										productId: event.target.value,
									})
								}
							/>
							<label className='flex items-center gap-2 text-sm text-slate-700'>
								<input
									type='checkbox'
									checked={Boolean(addOn.isCompulsory)}
									onChange={(event) =>
										updateItem('addOns', addOns, index, {
											...addOn,
											isCompulsory: event.target.checked,
										})
									}
								/>
								Compulsory
							</label>
						</div>
						<RowActions onRemove={() => removeItem('addOns', addOns, index)} />
					</div>
				))}
				<AddButton
					label='Add compatible add-on'
					onClick={() =>
						setJsonField('addOns', [
							...addOns,
							{ productId: '', isCompulsory: false },
						])
					}
				/>
			</div>

			<SectionHeader title='Product features' />
			<div className='space-y-3'>
				{features.map((feature, index) => (
					<div key={index} className='rounded-xl border border-slate-200 p-4'>
						<div className='grid gap-3 md:grid-cols-2'>
							<input
								className={inputClass}
								placeholder='Feature title'
								value={feature.title}
								onChange={(event) =>
									updateItem('features', features, index, {
										...feature,
										title: event.target.value,
									})
								}
							/>
							<input
								className={inputClass}
								placeholder='Second title line'
								value={feature.titleLine2 || ''}
								onChange={(event) =>
									updateItem('features', features, index, {
										...feature,
										titleLine2: event.target.value,
									})
								}
							/>
							<div>
								{getStagedImageUrl(stagedImages, 'features', index) ||
								getImageUrl(feature) ? (
									<UploadedImage
										url={
											getStagedImageUrl(stagedImages, 'features', index) ||
											getImageUrl(feature)
										}
										size='sm'
										onDelete={() => {
											onImageRemove?.('features', index, feature.image);
											updateItem('features', features, index, {
												...feature,
												image: undefined,
												imageUrl: '',
											});
										}}
									/>
								) : (
									<FileUpload
										label='Upload Feature Image'
										maxSizeMB={5}
										immediate={false}
										onFileSelect={(file, previewUrl) =>
											onImageSelect?.('features', index, file, previewUrl)
										}
									/>
								)}
							</div>
							<input
								className={inputClass}
								placeholder='Image alt text'
								value={feature.imageAlt || ''}
								onChange={(event) =>
									updateItem('features', features, index, {
										...feature,
										imageAlt: event.target.value,
									})
								}
							/>
							<input
								className={`${inputClass} md:col-span-2`}
								placeholder='Image class name'
								value={feature.imageClassName || ''}
								onChange={(event) =>
									updateItem('features', features, index, {
										...feature,
										imageClassName: event.target.value,
									})
								}
							/>
							<textarea
								className={`${textareaClass} md:col-span-2`}
								placeholder='Feature description'
								value={feature.description}
								onChange={(event) =>
									updateItem('features', features, index, {
										...feature,
										description: event.target.value,
									})
								}
							/>
						</div>
						<RowActions
							onRemove={() => removeItem('features', features, index)}
						/>
					</div>
				))}
				<AddButton
					label='Add feature'
					onClick={() =>
						setJsonField('features', [
							...features,
							{ title: '', description: '' },
						])
					}
				/>
			</div>

			<SectionHeader title='Specifications' />
			<div className='space-y-3'>
				{specifications.map((specification, index) => (
					<div
						key={index}
						className='grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-2'>
						<input
							className={inputClass}
							placeholder='Label'
							value={specification.label}
							onChange={(event) =>
								updateItem('specifications', specifications, index, {
									...specification,
									label: event.target.value,
								})
							}
						/>
						<textarea
							className={textareaClass}
							placeholder='Value'
							value={specification.value}
							onChange={(event) =>
								updateItem('specifications', specifications, index, {
									...specification,
									value: event.target.value,
								})
							}
						/>
						<div className='md:col-span-2'>
							<RowActions
								onRemove={() =>
									removeItem('specifications', specifications, index)
								}
							/>
						</div>
					</div>
				))}
				<AddButton
					label='Add specification'
					onClick={() =>
						setJsonField('specifications', [
							...specifications,
							{ label: '', value: '' },
						])
					}
				/>
			</div>

			<SectionHeader title='Inside the box' />
			<div className='space-y-3'>
				{boxItems.map((item, index) => (
					<div key={index} className='rounded-xl border border-slate-200 p-4'>
						<div className='grid gap-3 md:grid-cols-2'>
							<input
								className={inputClass}
								placeholder='Item title'
								value={item.title}
								onChange={(event) =>
									updateItem('boxItems', boxItems, index, {
										...item,
										title: event.target.value,
									})
								}
							/>
							<div>
								{getStagedImageUrl(stagedImages, 'boxItems', index) ||
								getImageUrl(item) ? (
									<UploadedImage
										url={
											getStagedImageUrl(stagedImages, 'boxItems', index) ||
											getImageUrl(item)
										}
										size='sm'
										onDelete={() => {
											onImageRemove?.('boxItems', index, item.image);
											updateItem('boxItems', boxItems, index, {
												...item,
												image: undefined,
												imageUrl: '',
											});
										}}
									/>
								) : (
									<FileUpload
										label='Upload Box Item Image'
										maxSizeMB={5}
										immediate={false}
										onFileSelect={(file, previewUrl) =>
											onImageSelect?.('boxItems', index, file, previewUrl)
										}
									/>
								)}
							</div>
							<input
								className={`${inputClass} md:col-span-2`}
								placeholder='Image alt text'
								value={item.imageAlt || ''}
								onChange={(event) =>
									updateItem('boxItems', boxItems, index, {
										...item,
										imageAlt: event.target.value,
									})
								}
							/>
							<textarea
								className={`${textareaClass} md:col-span-2`}
								placeholder='Optional description'
								value={item.description || ''}
								onChange={(event) =>
									updateItem('boxItems', boxItems, index, {
										...item,
										description: event.target.value,
									})
								}
							/>
						</div>
						<RowActions onRemove={() => removeItem('boxItems', boxItems, index)} />
					</div>
				))}
				<AddButton
					label='Add box item'
					onClick={() =>
						setJsonField('boxItems', [
							...boxItems,
							{ title: '' },
						])
					}
				/>
			</div>
		</div>
	);
}

function SectionHeader({ title }: { title: string }) {
	return (
		<div className='border-t border-slate-200 pt-5'>
			<h3 className='text-sm font-semibold uppercase tracking-wide text-slate-700'>
				{title}
			</h3>
		</div>
	);
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<button
			type='button'
			className='rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900'
			onClick={onClick}>
			{label}
		</button>
	);
}

function RowActions({ onRemove }: { onRemove: () => void }) {
	return (
		<div className='mt-3 flex justify-end'>
			<button
				type='button'
				className='text-sm font-medium text-red-600 hover:text-red-700'
				onClick={onRemove}>
				Remove
			</button>
		</div>
	);
}

function parseArray<T>(value: string): T[] {
	try {
		const parsed = JSON.parse(value || '[]');
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function toColorInputValue(value: string) {
	return /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';
}

function getImageUrl(item: { image?: { url?: string }; imageUrl?: string }) {
	return item.image?.url || item.imageUrl || '';
}

export function detailImageKey(
	field: ProductDetailImageField,
	index: number,
) {
	return `${field}.${index}`;
}

function getStagedImageUrl(
	stagedImages: StagedProductDetailImages,
	field: ProductDetailImageField,
	index: number,
) {
	return stagedImages[detailImageKey(field, index)]?.previewUrl || '';
}
