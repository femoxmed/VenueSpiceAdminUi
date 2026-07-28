import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { useToast } from '@/components/shared/toast-provider';
import {
	useDeleteProduct,
	useProducts,
	useUpdateProduct,
} from '@/features/products/hooks';
import type { ProductRow } from '@/features/products/api';
import {
	appendProductFormData,
	dateTimeInputValueToIso,
	emptyProductForm,
	isoToDateTimeInputValue,
	productToForm,
	slugifyProductName,
} from '@/features/products/form';
import { ProductDetailFields } from '@/features/products/detail-fields';
import { currency } from '@/lib/utils';

export function ProductsPage() {
	const { data } = useProducts();
	const { push } = useToast();
	const navigate = useNavigate();
	const rows = data ?? [];

	const [form, setForm] = useState(emptyProductForm);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
		null,
	);
	const updateProductMutation = useUpdateProduct();
	const deleteProductMutation = useDeleteProduct();

	const handleDeleteProduct = async (product: ProductRow) => {
		if (
			!window.confirm(
				`Delete ${product.name}? This will remove the product and its uploaded product images.`,
			)
		) {
			return;
		}

		try {
			const result = await deleteProductMutation.mutateAsync(product.id);
			push({
				title: result.archived ? 'Product archived' : 'Product deleted',
				description: result.archived
					? `${product.name} has order or installation history, so it was archived instead.`
					: `${product.name} has been removed from the catalogue.`,
			});
		} catch (error) {
			push({
				title: 'Unable to delete product',
				description:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred.',
				variant: 'error',
			});
		}
	};

	const resetForm = () => {
		setForm(emptyProductForm);
	};

	const renderProductFields = () => (
		<>
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
			<label className='text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2'>
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
			<ProductDetailFields form={form} setForm={setForm} />
		</>
	);

	const columns: ColumnDef<ProductRow>[] = [
		{
			key: 'image',
			header: 'Image',
			render: (row) =>
				row.mainImage ? (
					<img
						src={row.mainImage.url}
						alt={row.name}
						className='h-12 w-12 object-cover rounded-lg border'
					/>
				) : null,
		},
		{
			key: 'name',
			header: 'Product',
			render: (row) => row.name,
			searchValue: (row) => `${row.name} ${row.sku}`,
		},
		{
			key: 'sku',
			header: 'SKU',
			render: (row) => row.sku,
			searchValue: (row) => row.sku,
		},
		{
			key: 'price',
			header: 'Price',
			render: (row) => currency(Number(row.price)),
			searchValue: (row) => String(row.price),
		},
		{
			key: 'stock',
			header: 'Stock',
			render: (row) => row.stock,
			searchValue: (row) => String(row.stock),
		},
		{
			key: 'status',
			header: 'Status',
			render: (row) => (
				<span className='rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700'>
					{row.status || 'draft'}
				</span>
			),
			searchValue: (row) => row.status || 'draft',
		},
		{
			key: 'featured',
			header: 'Featured',
			render: (row) =>
				row.featuredAt ? (
					<span className='rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700'>
						Banner
					</span>
				) : (
					<span className='text-xs text-slate-400'>No</span>
				),
			searchValue: (row) => (row.featuredAt ? 'featured banner' : 'not featured'),
		},
		{
			key: 'actions',
			header: 'Actions',
			render: (row) => (
				<div className='flex items-center gap-2'>
					<button
						className='text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50'
						onClick={(e) => {
							e.stopPropagation();
							window.location.href = `/products/${row.id}`;
						}}>
						View
					</button>
					<button
						className='text-sm text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-50'
						onClick={(e) => {
							e.stopPropagation();
							window.location.href = `/products/${row.id}/edit`;
						}}>
						Edit
					</button>
					<button
						className='text-sm text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50'
						disabled={deleteProductMutation.isPending}
						onClick={(e) => {
							e.stopPropagation();
							handleDeleteProduct(row);
						}}>
						Delete
					</button>
				</div>
			),
		},
	];

	return (
		<section className='space-y-6'>
			<PageHeader
				title='Products'
				description='Manage machine and filter catalogue entries, pricing, and inventory levels.'
			/>
			<DataTable
				rows={rows}
				columns={columns}
				searchPlaceholder='Search products by name or SKU'
				actions={
					<button
						className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
						onClick={() => navigate('/products/create')}>
						Create Product
					</button>
				}
			/>

			<Modal
				open={editOpen}
				onClose={() => {
					setEditOpen(false);
					setSelectedProduct(null);
					resetForm();
				}}
				title='Edit product'
				description='Update product details, pricing, and inventory levels.'
				footer={
					<>
						<button
							className='rounded-xl border border-slate-200 px-4 py-2 text-sm'
							onClick={() => {
								setEditOpen(false);
								setSelectedProduct(null);
								resetForm();
							}}>
							Cancel
						</button>
						<button
							className='rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'
							disabled={updateProductMutation.isPending}
							onClick={async () => {
								if (!selectedProduct) return;

								try {
									const payload = new FormData();
									appendProductFormData(payload, form);

									await updateProductMutation.mutateAsync({
										productId: selectedProduct.id,
										payload,
									});

									push({
										title: 'Product updated',
										description:
											'Product details have been updated successfully.',
									});
									setEditOpen(false);
									setSelectedProduct(null);
									resetForm();
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
							}}>
							{updateProductMutation.isPending ? 'Saving...' : 'Save changes'}
						</button>
					</>
				}>
				<div className='grid gap-4 md:grid-cols-2'>
					{renderProductFields()}
				</div>
			</Modal>
		</section>
	);
}
