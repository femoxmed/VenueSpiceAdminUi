import { useState } from 'react';
import { ShoppingCart, Eye, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { MetricCard } from '@/components/shared/metric-card';
import { Modal } from '@/components/shared/modal';
import { useAllCarts } from '@/features/cart/hooks';
import { Cart } from '@/features/cart/api';
import { currency, formatDate } from '@/lib/utils';

export function CartsPage() {
	const { data: carts, isLoading } = useAllCarts();
	const [selectedCart, setSelectedCart] = useState<Cart | null>(null);

	const totalActiveCarts = carts?.length ?? 0;
	const totalCartValue =
		carts?.reduce((sum, cart) => sum + cart.summary.subtotal, 0) ?? 0;
	const avgCartValue =
		totalActiveCarts > 0 ? totalCartValue / totalActiveCarts : 0;
	const totalItems =
		carts?.reduce((sum, cart) => sum + cart.summary.itemCount, 0) ?? 0;

	const columns = [
		{
			key: 'user',
			header: 'Customer',
			render: (cart: Cart) => (
				<div>
					<div className='font-medium text-slate-900'>
						{cart.customerName || 'Guest User'}
					</div>
					<div className='text-sm text-slate-500'>
						{cart.customerEmail || cart.userId.slice(0, 8)}
					</div>
				</div>
			),
		},
		{
			key: 'items',
			header: 'Items',
			render: (cart: Cart) => (
				<span>
					{cart.summary.itemCount} items ({cart.summary.distinctItems} products)
				</span>
			),
		},
		{
			key: 'subtotal',
			header: 'Value',
			render: (cart: Cart) => (
				<span className='font-medium'>{currency(cart.summary.subtotal)}</span>
			),
		},
		{
			key: 'updatedAt',
			header: 'Last Active',
			render: (cart: Cart) => (
				<span className='text-slate-500'>{formatDate(cart.updatedAt)}</span>
			),
		},
		{
			key: 'actions',
			header: '',
			render: (cart: Cart) => (
				<button
					onClick={() => setSelectedCart(cart)}
					className='flex items-center gap-2 text-blue-600 hover:text-blue-800'>
					<Eye size={16} />
					View
				</button>
			),
		},
	];

	return (
		<section>
			<PageHeader
				title='Customer Carts'
				description='View all active shopping carts across your platform'
			/>

			<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4 mb-6'>
				<MetricCard
					title='Active Carts'
					value={String(totalActiveCarts)}
					helper='Currently active carts'
					icon={<ShoppingCart size={22} />}
				/>
				<MetricCard
					title='Total Cart Value'
					value={currency(totalCartValue)}
					helper='Combined value of all carts'
					icon={<Clock size={22} />}
				/>
				<MetricCard
					title='Average Cart'
					value={currency(avgCartValue)}
					helper='Average cart value'
					icon={<ShoppingCart size={22} />}
				/>
				<MetricCard
					title='Total Items'
					value={String(totalItems)}
					helper='Total items in carts'
					icon={<ShoppingCart size={22} />}
				/>
			</div>

			<DataTable rows={carts || []} columns={columns} />

			<Modal
				open={!!selectedCart}
				onClose={() => setSelectedCart(null)}
				title='Cart Details'>
				{selectedCart && (
					<div className='space-y-4'>
						<div className='border-b pb-4'>
							<div className='font-medium'>
								{selectedCart.customerName || 'Guest User'}
							</div>
							<div className='text-sm text-slate-500'>
								{selectedCart.customerEmail || selectedCart.userId}
							</div>
							<div className='text-sm text-slate-500 mt-1'>
								Last updated: {formatDate(selectedCart.updatedAt)}
							</div>
						</div>

						<h4 className='font-semibold'>Cart Items</h4>
						<div className='border rounded-lg overflow-hidden'>
							<table className='w-full text-sm'>
								<thead className='bg-slate-50'>
									<tr>
										<th className='px-4 py-3 text-left font-medium text-slate-600'>
											Product
										</th>
										<th className='px-4 py-3 text-center font-medium text-slate-600'>
											Qty
										</th>
										<th className='px-4 py-3 text-right font-medium text-slate-600'>
											Price
										</th>
										<th className='px-4 py-3 text-right font-medium text-slate-600'>
											Total
										</th>
									</tr>
								</thead>
								<tbody className='divide-y'>
									{selectedCart.items.map((item, i) => (
										<tr key={i}>
											<td className='px-4 py-3'>{item.productName}</td>
											<td className='px-4 py-3 text-center'>{item.quantity}</td>
											<td className='px-4 py-3 text-right'>
												{currency(item.unitPrice)}
											</td>
											<td className='px-4 py-3 text-right font-medium'>
												{currency(item.lineTotal)}
											</td>
										</tr>
									))}
								</tbody>
								<tfoot className='bg-slate-50 font-medium'>
									<tr>
										<td colSpan={3} className='px-4 py-3 text-right'>
											Total
										</td>
										<td className='px-4 py-3 text-right'>
											{currency(selectedCart.summary.subtotal)}
										</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				)}
			</Modal>
		</section>
	);
}
