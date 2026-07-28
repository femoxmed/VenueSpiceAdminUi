import { useNavigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useDeleteProduct, useProduct } from '@/features/products/hooks';
import { PageHeader } from '@/components/shared/page-header';
import { useToast } from '@/components/shared/toast-provider';
import { currency } from '@/lib/utils';

export function ProductDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { push } = useToast();
	const { data: product, isLoading } = useProduct(id ?? '');
	const deleteProductMutation = useDeleteProduct();

	const handleDelete = async () => {
		if (!product) return;

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
			navigate('/products');
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
				title={product.name}
				description={`SKU: ${product.sku}`}
				action={
					<div className='flex gap-3'>
						<button
							className='rounded-xl border border-slate-200 px-4 py-2 text-sm'
							onClick={() => navigate(`/products/${product.id}/edit`)}>
							Edit Product
						</button>
						<button
							className='rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
							disabled={deleteProductMutation.isPending}
							onClick={handleDelete}>
							{deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
						</button>
					</div>
				}
			/>

			<div className='grid gap-6'>
				{/* Banner Image */}
				{product.bannerImage && (
					<div className='relative w-full h-64 rounded-xl overflow-hidden border'>
						<img
							src={product.bannerImage.url}
							alt={product.name}
							className='w-full h-full object-cover'
						/>
					</div>
				)}

				<div className='grid md:grid-cols-3 gap-6'>
					{/* Main Image */}
					<div className='md:col-span-2'>
						{product.mainImage && (
							<div className='w-full aspect-square rounded-xl overflow-hidden border bg-white'>
								<img
									src={product.mainImage.url}
									alt={product.name}
									className='w-full h-full object-contain p-8'
								/>
							</div>
						)}

						{/* Gallery */}
						{product.galleryImages && product.galleryImages.length > 0 && (
							<div className='mt-6'>
								<h3 className='text-lg font-medium mb-4'>Gallery</h3>
								<div className='grid grid-cols-4 gap-4'>
									{product.galleryImages.map((image, idx) => (
										<div
											key={idx}
											className='aspect-square rounded-lg overflow-hidden border'>
											<img
												src={image.url}
												alt={`${product.name} ${idx + 1}`}
												className='w-full h-full object-cover'
											/>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Details */}
					<div className='space-y-6'>
						<div className='bg-white rounded-xl border p-6 space-y-4'>
							<div>
								<label className='text-xs text-gray-500 uppercase font-medium'>
									Price
								</label>
								<p className='text-3xl font-bold'>
									{currency(Number(product.price))}
								</p>
							</div>

							<div>
								<label className='text-xs text-gray-500 uppercase font-medium'>
									Stock
								</label>
								<p className='text-xl font-medium'>
									{product.stock} units in stock
								</p>
							</div>

							<div>
								<label className='text-xs text-gray-500 uppercase font-medium'>
									SKU
								</label>
								<p className='font-mono text-sm'>{product.sku}</p>
							</div>

							<div>
								<label className='text-xs text-gray-500 uppercase font-medium'>
									Status
								</label>
								<p className='text-sm capitalize'>{product.status || 'draft'}</p>
							</div>

							<div>
								<label className='text-xs text-gray-500 uppercase font-medium'>
									Featured banner
								</label>
								<p className='text-sm'>
									{product.featuredAt
										? new Date(product.featuredAt).toLocaleString()
										: 'No'}
								</p>
							</div>

							{product.slug ? (
								<div>
									<label className='text-xs text-gray-500 uppercase font-medium'>
										Public slug
									</label>
									<p className='font-mono text-sm'>{product.slug}</p>
								</div>
							) : null}

							<div>
								<label className='text-xs text-gray-500 uppercase font-medium'>
									Added
								</label>
								<p className='text-sm'>
									{product.createdAt
										? new Date(product.createdAt).toLocaleDateString()
										: 'Not available'}
								</p>
							</div>
						</div>

						{product.shortDescription ? (
							<div className='bg-white rounded-xl border p-6'>
								<label className='text-xs text-gray-500 uppercase font-medium'>
									Short description
								</label>
								<p className='mt-2 text-sm text-slate-700'>
									{product.shortDescription}
								</p>
							</div>
						) : null}

						<div className='flex gap-4'>
							<button
								className='flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white'
								onClick={() => navigate(`/products/${product.id}/edit`)}>
								Edit Product
							</button>
							<button
								className='flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-50'
								disabled={deleteProductMutation.isPending}
								onClick={handleDelete}>
								{deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			</div>

			{product.colors && product.colors.length > 0 ? (
				<DetailSection title='Color variants'>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{product.colors.map((color) => (
							<div
								key={color.id}
								className='rounded-xl border bg-white p-4'>
								<div className='flex items-center gap-3'>
									<span
										className='h-10 w-10 rounded-full border border-slate-200'
										style={{ backgroundColor: color.value }}
									/>
									<div>
										<p className='font-medium'>{color.label}</p>
										<p className='font-mono text-xs text-slate-500'>
											{color.value}
										</p>
									</div>
								</div>
								{detailImageUrl(color) ? (
									<img
										src={detailImageUrl(color)}
										alt={color.label}
										className='mt-4 h-32 w-full rounded-lg border object-cover'
									/>
								) : null}
							</div>
						))}
					</div>
				</DetailSection>
			) : null}

			{product.features && product.features.length > 0 ? (
				<DetailSection title='Features'>
					<div className='grid gap-4 md:grid-cols-2'>
						{product.features.map((feature, index) => (
							<div key={index} className='rounded-xl border bg-white p-4'>
								{detailImageUrl(feature) ? (
									<img
										src={detailImageUrl(feature)}
										alt={feature.imageAlt || feature.title}
										className='h-44 w-full rounded-lg border object-cover'
									/>
								) : null}
								<h3 className='mt-4 text-lg font-semibold'>
									{feature.title}
									{feature.titleLine2 ? ` ${feature.titleLine2}` : ''}
								</h3>
								<p className='mt-2 text-sm leading-6 text-slate-600'>
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</DetailSection>
			) : null}

			{product.specifications && product.specifications.length > 0 ? (
				<DetailSection title='Specifications'>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{product.specifications.map((specification) => (
							<div
								key={specification.label}
								className='rounded-xl border bg-white p-4'>
								<p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
									{specification.label}
								</p>
								<p className='mt-2 whitespace-pre-line text-sm text-slate-800'>
									{specification.value}
								</p>
							</div>
						))}
					</div>
				</DetailSection>
			) : null}

			{product.boxItems && product.boxItems.length > 0 ? (
				<DetailSection title='Inside the box'>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{product.boxItems.map((item, index) => (
							<div key={index} className='rounded-xl border bg-white p-4'>
								{detailImageUrl(item) ? (
									<img
										src={detailImageUrl(item)}
										alt={item.imageAlt || item.title}
										className='h-36 w-full rounded-lg border object-contain'
									/>
								) : null}
								<h3 className='mt-4 font-semibold'>{item.title}</h3>
								{item.description ? (
									<p className='mt-2 text-sm text-slate-600'>{item.description}</p>
								) : null}
							</div>
						))}
					</div>
				</DetailSection>
			) : null}
		</section>
	);
}

function DetailSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className='space-y-4'>
			<h2 className='text-xl font-semibold text-slate-900'>{title}</h2>
			{children}
		</section>
	);
}

function detailImageUrl(item: { image?: { url?: string }; imageUrl?: string }) {
	return item.image?.url || item.imageUrl || '';
}
