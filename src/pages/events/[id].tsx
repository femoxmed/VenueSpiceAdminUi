import {
	ArrowLeft,
	CalendarDays,
	CircleDollarSign,
	Pencil,
	MapPin,
	Package,
	ReceiptText,
	Ticket,
	UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/components/shared/toast-provider';
import { useOrders } from '@/features/orders/hooks';
import type { TicketOrderRow } from '@/features/orders/api';
import { useEvents, useUpdateEventSlug } from '@/features/ticketing/hooks';
import type { Event, TicketType } from '@/features/ticketing/api';
import { authStore } from '@/lib/auth-store';
import { Role } from '@/lib/roles';
import { currency, formatDate } from '@/lib/utils';

type MerchItem = {
	type?: string;
	name?: string;
	description?: string;
	price?: number | string;
	quantity?: number;
	limitPerPerson?: number;
	includeCharges?: boolean;
};

export function EventDetailPage() {
	const { id = '' } = useParams();
	const { data: events = [], isLoading: eventsLoading } = useEvents();
	const { data: orders = [], isLoading: ordersLoading } = useOrders();
	const event = events.find((item) => item.id === id);

	if (eventsLoading) {
		return <div className='card p-6 text-sm text-slate-500'>Loading event...</div>;
	}

	if (!event) {
		return (
			<section className='space-y-4'>
				<Link to='/events' className='inline-flex items-center gap-2 text-sm font-medium text-primary'>
					<ArrowLeft size={16} />
					Back to events
				</Link>
				<div className='card p-6 text-sm text-rose-600'>Unable to load this event.</div>
			</section>
		);
	}

	const eventOrders = orders.filter((order) => order.event?.id === event.id);
	const paidOrders = eventOrders.filter((order) => order.status === 'paid');
	const ticketRevenue = paidOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
	const taxCollected = paidOrders.reduce((sum, order) => sum + Number(order.tax || 0), 0);
	const totalCollected = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
	const ticketsSold = event.ticketTypes?.reduce((sum, ticket) => sum + Number(ticket.quantitySold || 0), 0) ?? 0;
	const ticketsAvailable = event.ticketTypes?.reduce((sum, ticket) => sum + Number(ticket.quantity || 0), 0) ?? 0;
	const buyers = new Set(paidOrders.map((order) => order.customerEmail)).size;
	const merchItems = normalizeMerch(event.addOns);
	const canManageSlug = [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN].includes(authStore.getRole() as Role);

	return (
		<section className='space-y-6'>
			<PageHeader
				title={event.title}
				description='Event operations, ticket inventory, revenue, buyers, and configured add-ons.'
				action={
					<Link
						to='/events'
						className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'>
						<ArrowLeft size={16} />
						Back
					</Link>
				}
			/>

			<div className='grid gap-4 xl:grid-cols-[1.2fr_0.8fr]'>
				<div className='card overflow-hidden'>
					{event.coverImageUrl ? (
						<img src={event.coverImageUrl} alt='' className='h-64 w-full object-cover' />
					) : (
						<div className='grid h-48 place-items-center bg-gradient-to-r from-primary-10 via-secondary-10 to-tertiary-10 text-sm font-semibold text-slate-500'>
							No event image
						</div>
					)}
					<div className='p-6'>
						<div className='flex flex-wrap items-center gap-2'>
							<StatusBadge value={event.status} />
							<StatusBadge value={event.category || 'uncategorized'} />
							<StatusBadge value={event.isVirtual ? 'virtual' : 'in person'} />
						</div>
						<p className='mt-4 text-sm leading-6 text-slate-600'>{event.description || 'No description provided.'}</p>
						<div className='mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2'>
							<InfoLine icon={<CalendarDays size={16} />} label='Starts' value={formatDate(event.startsAt)} />
							<InfoLine icon={<CalendarDays size={16} />} label='Ends' value={event.endsAt ? formatDate(event.endsAt) : 'Not set'} />
							<InfoLine icon={<MapPin size={16} />} label='Venue' value={[event.venue, event.city, event.state].filter(Boolean).join(', ') || 'Venue TBD'} />
							<InfoLine icon={<UsersRound size={16} />} label='Organizer' value={event.organizerName || event.organization?.name || 'Not set'} />
						</div>
					</div>
				</div>

				<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-1'>
					<Metric icon={<CircleDollarSign size={20} />} label='Total collected' value={currency(totalCollected)} helper={`${currency(ticketRevenue)} subtotal`} />
					<Metric icon={<Ticket size={20} />} label='Tickets sold' value={`${ticketsSold}/${ticketsAvailable}`} helper={`${buyers} unique buyers`} />
					<Metric icon={<ReceiptText size={20} />} label='Paid orders' value={paidOrders.length} helper={`${eventOrders.length} total orders`} />
					<Metric icon={<Package size={20} />} label='Merch configured' value={merchItems.length} helper='Sales tracking pending checkout add-ons' />
				</div>
			</div>

			<div className='grid gap-6 xl:grid-cols-2'>
				<TicketInventory tickets={event.ticketTypes || []} paidOrders={paidOrders} />
				<MerchandisePanel items={merchItems} />
			</div>

			<RevenuePanel
				subtotal={ticketRevenue}
				tax={taxCollected}
				total={totalCollected}
				orders={paidOrders.length}
				refunded={eventOrders.filter((order) => order.status === 'refunded').length}
			/>

			<OrdersPanel orders={eventOrders} loading={ordersLoading} />

			<div className='card p-6'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<h3 className='text-lg font-semibold text-slate-950'>Event Metadata</h3>
					{canManageSlug ? <EventSlugEditor event={event} /> : null}
				</div>
				<div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
					<Detail label='Event ID' value={event.id} />
					<Detail label='Slug' value={event.slug} />
					<Detail label='Organization' value={event.organization?.name} />
					<Detail label='Country' value={event.country} />
					<Detail label='City' value={event.city} />
					<Detail label='State' value={event.state} />
					<Detail label='Street address' value={event.streetAddress} />
					<Detail label='Timezone' value={event.timezone} />
					<Detail label='Created at' value={event.createdAt ? formatDate(event.createdAt) : undefined} />
					<Detail label='Updated at' value={event.updatedAt ? formatDate(event.updatedAt) : undefined} />
				</div>
			</div>
		</section>
	);
}

function EventSlugEditor({ event }: { event: Event }) {
	const { push } = useToast();
	const updateSlug = useUpdateEventSlug();
	const [open, setOpen] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [slug, setSlug] = useState(event.slug);
	const normalizedSlug = slugify(slug);
	const isChanged = normalizedSlug !== event.slug;

	function closeEditor() {
		setOpen(false);
		setConfirmOpen(false);
		setSlug(event.slug);
	}

	async function saveSlug() {
		if (!normalizedSlug || !isChanged) return;
		try {
			const updated = await updateSlug.mutateAsync({ id: event.id, slug: normalizedSlug });
			setSlug(updated.slug);
			setConfirmOpen(false);
			setOpen(false);
			push({
				title: 'Event slug updated',
				description: `The event is now available at /events/${updated.slug}.`,
			});
		} catch (error) {
			push({
				title: 'Slug could not be updated',
				description: error instanceof Error ? error.message : 'Choose a different slug and try again.',
				variant: 'error',
			});
		}
	}

	if (!open) {
		return (
			<button
				type='button'
				onClick={() => setOpen(true)}
				className='inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'>
				<Pencil size={15} />
				Edit slug
			</button>
		);
	}

	return (
		<>
			<div className='w-full rounded-xl border border-slate-200 bg-slate-50 p-4 sm:w-auto sm:min-w-[420px]'>
				<label className='block text-sm font-semibold text-slate-800' htmlFor='event-slug'>
					Public event slug
				</label>
				<div className='mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:border-primary'>
					<span className='shrink-0 text-sm text-slate-400'>/events/</span>
					<input
						id='event-slug'
						value={slug}
						onChange={(input) => setSlug(input.target.value)}
						className='h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none'
						placeholder='event-slug'
					/>
				</div>
				{slug && slug !== normalizedSlug ? (
					<p className='mt-2 text-xs text-slate-500'>It will be saved as <span className='font-mono text-slate-700'>{normalizedSlug || 'invalid-slug'}</span>.</p>
				) : null}
				<div className='mt-3 flex justify-end gap-2'>
					<button type='button' onClick={closeEditor} className='h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-white'>Cancel</button>
					<button
						type='button'
						onClick={() => setConfirmOpen(true)}
						disabled={!normalizedSlug || !isChanged || updateSlug.isPending}
						className='h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'>
						Review change
					</button>
				</div>
			</div>

			<Modal
				open={confirmOpen}
				title='Change public event link?'
				description='Existing bookmarks, campaigns, QR codes, and previously shared links using the current slug will stop opening this event.'
				onClose={() => setConfirmOpen(false)}
				footer={(
					<>
						<button type='button' onClick={() => setConfirmOpen(false)} className='rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'>Cancel</button>
						<button type='button' onClick={() => void saveSlug()} disabled={updateSlug.isPending} className='rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60'>
							{updateSlug.isPending ? 'Updating...' : 'Change event link'}
						</button>
					</>
				)}>
				<div className='space-y-3 text-sm'>
					<div><p className='text-slate-500'>Current</p><p className='mt-1 break-all font-mono text-slate-800'>/events/{event.slug}</p></div>
					<div><p className='text-slate-500'>New</p><p className='mt-1 break-all font-mono font-semibold text-primary'>/events/{normalizedSlug}</p></div>
				</div>
			</Modal>
		</>
	);
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '');
}

function TicketInventory({ tickets, paidOrders }: { tickets: TicketType[]; paidOrders: TicketOrderRow[] }) {
	return (
		<div className='card p-6'>
			<h3 className='text-lg font-semibold text-slate-950'>Tickets</h3>
			<div className='mt-5 overflow-x-auto'>
				<table className='min-w-full text-left text-sm'>
					<thead className='text-xs uppercase text-slate-500'>
						<tr>
							<th className='py-3 pr-4'>Type</th>
							<th className='py-3 pr-4'>Price</th>
							<th className='py-3 pr-4'>Sold</th>
							<th className='py-3 pr-4'>Revenue</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-slate-100'>
						{tickets.length ? tickets.map((ticket) => {
							const soldFromOrders = paidOrders.reduce((sum, order) => {
								return sum + (order.items || [])
									.filter((item) => item.ticketName === ticket.name)
									.reduce((itemSum, item) => itemSum + Number(item.quantity || item.qty || 0), 0);
							}, 0);
							const revenue = paidOrders.reduce((sum, order) => {
								return sum + (order.items || [])
									.filter((item) => item.ticketName === ticket.name)
									.reduce((itemSum, item) => itemSum + Number(item.lineTotal || 0), 0);
							}, 0);
							const sold = Number(ticket.quantitySold || soldFromOrders || 0);
							return (
								<tr key={ticket.id || ticket.name}>
									<td className='py-3 pr-4 font-medium text-slate-900'>{ticket.name}</td>
									<td className='py-3 pr-4 text-slate-600'>{currency(Number(ticket.price || 0))}</td>
									<td className='py-3 pr-4 text-slate-600'>{sold}/{ticket.quantity}</td>
									<td className='py-3 pr-4 font-semibold text-slate-900'>{currency(revenue)}</td>
								</tr>
							);
						}) : (
							<tr><td colSpan={4} className='py-6 text-sm text-slate-500'>No ticket types configured.</td></tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function MerchandisePanel({ items }: { items: MerchItem[] }) {
	return (
		<div className='card p-6'>
			<h3 className='text-lg font-semibold text-slate-950'>Merchandise & Add-ons</h3>
			<div className='mt-5 grid gap-3'>
				{items.length ? items.map((item, index) => (
					<div key={`${item.type || item.name || 'merch'}-${index}`} className='rounded-xl border border-slate-100 bg-slate-50 p-4'>
						<div className='flex items-start justify-between gap-4'>
							<div>
								<p className='font-semibold text-slate-950'>{item.type || item.name || `Add-on ${index + 1}`}</p>
								<p className='mt-1 text-sm text-slate-500'>{item.description || 'No description.'}</p>
							</div>
							<p className='font-semibold text-slate-900'>{currency(Number(item.price || 0))}</p>
						</div>
						<div className='mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3'>
							<span>Quantity: {item.quantity ?? 'Not set'}</span>
							<span>Limit/person: {item.limitPerPerson ?? 'Not set'}</span>
							<span>Sold: 0</span>
						</div>
					</div>
				)) : (
					<div className='rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500'>No merchandise or add-ons configured.</div>
				)}
			</div>
			<p className='mt-4 text-xs text-slate-500'>Merchandise sales will populate here once checkout stores add-on order lines.</p>
		</div>
	);
}

function RevenuePanel({ subtotal, tax, total, orders, refunded }: { subtotal: number; tax: number; total: number; orders: number; refunded: number }) {
	return (
		<div className='card p-6'>
			<h3 className='text-lg font-semibold text-slate-950'>Revenue</h3>
			<div className='mt-5 grid gap-4 md:grid-cols-5'>
				<Detail label='Ticket subtotal' value={currency(subtotal)} />
				<Detail label='Tax collected' value={currency(tax)} />
				<Detail label='Gross collected' value={currency(total)} />
				<Detail label='Paid orders' value={orders} />
				<Detail label='Refunded orders' value={refunded} />
			</div>
		</div>
	);
}

function OrdersPanel({ orders, loading }: { orders: TicketOrderRow[]; loading: boolean }) {
	return (
		<div className='card p-6'>
			<h3 className='text-lg font-semibold text-slate-950'>Buyers & Orders</h3>
			<div className='mt-5 overflow-x-auto'>
				<table className='min-w-full text-left text-sm'>
					<thead className='text-xs uppercase text-slate-500'>
						<tr>
							<th className='py-3 pr-4'>Buyer</th>
							<th className='py-3 pr-4'>Items</th>
							<th className='py-3 pr-4'>Tickets</th>
							<th className='py-3 pr-4'>Total</th>
							<th className='py-3 pr-4'>Status</th>
							<th className='py-3 pr-4'>Purchased</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-slate-100'>
						{loading ? (
							<tr><td colSpan={6} className='py-6 text-sm text-slate-500'>Loading orders...</td></tr>
						) : orders.length ? orders.map((order) => (
							<tr key={order.id}>
								<td className='py-3 pr-4'>
									<p className='font-medium text-slate-900'>{order.customerName}</p>
									<p className='text-xs text-slate-500'>{order.customerEmail}</p>
								</td>
								<td className='py-3 pr-4 text-slate-600'>
									{(order.items || []).map((item) => `${item.ticketName} x${item.quantity || item.qty || 0}`).join(', ') || 'No items'}
								</td>
								<td className='py-3 pr-4 text-slate-600'>{order.tickets?.length ?? 0} issued</td>
								<td className='py-3 pr-4 font-semibold text-slate-900'>{currency(Number(order.total || 0))}</td>
								<td className='py-3 pr-4'><StatusBadge value={order.status} /></td>
								<td className='py-3 pr-4 text-slate-500'>{order.paidAt ? formatDate(order.paidAt) : formatDate(order.createdAt)}</td>
							</tr>
						)) : (
							<tr><td colSpan={6} className='py-6 text-sm text-slate-500'>No buyers or orders yet.</td></tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function Metric({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string | number; helper: string }) {
	return (
		<div className='card p-5'>
			<div className='flex items-center gap-3'>
				<div className='grid h-10 w-10 place-items-center rounded-xl bg-primary-10 text-primary'>{icon}</div>
				<div>
					<p className='text-sm text-slate-500'>{label}</p>
					<p className='mt-1 text-xl font-semibold text-slate-950'>{value}</p>
				</div>
			</div>
			<p className='mt-3 text-xs text-slate-500'>{helper}</p>
		</div>
	);
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className='flex gap-2'>
			<span className='mt-0.5 text-primary'>{icon}</span>
			<div>
				<p className='text-xs font-semibold uppercase text-slate-400'>{label}</p>
				<p className='text-slate-700'>{value}</p>
			</div>
		</div>
	);
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
	return (
		<div className='rounded-xl border border-slate-100 bg-slate-50 p-4'>
			<p className='text-xs font-medium uppercase tracking-wide text-slate-400'>{label}</p>
			<p className='mt-1 break-words text-sm font-medium text-slate-800'>{value ?? 'Not set'}</p>
		</div>
	);
}

function normalizeMerch(addOns?: Array<Record<string, unknown>>) {
	return (addOns || []).map((item) => item as MerchItem);
}
