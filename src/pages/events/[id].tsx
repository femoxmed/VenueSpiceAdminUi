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
	X,
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
import { useUpdateEvent } from '@/features/ticketing/hooks';
import { FileUpload } from '@/components/shared/file-upload';
import type { Event, TicketType } from '@/features/ticketing/api';
import { authStore } from '@/lib/auth-store';
import { Role } from '@/lib/roles';
import { currency, formatDate } from '@/lib/utils';
import { dateTimeLocalToIso, formatDateTimeLocal } from '@/lib/timezones';

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
			{canManageSlug ? <AdminEventEditor event={event} /> : null}

			<div className='grid gap-4 xl:grid-cols-[1.2fr_0.8fr]'>
				<div className='card overflow-hidden'>
					{event.coverImageUrl || event.portraitImageUrl ? (
						<div className='grid grid-cols-2 gap-2 bg-slate-50 p-2'>
							{event.coverImageUrl ? <img src={event.coverImageUrl} alt='Landscape event artwork' className='h-64 w-full object-cover' /> : null}
							{event.portraitImageUrl ? <img src={event.portraitImageUrl} alt='Portrait event artwork' className='h-64 w-full object-cover' /> : null}
						</div>
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

function AdminEventEditor({ event }: { event: Event }) {
	const { push } = useToast();
	const update = useUpdateEvent();
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState({
		title: event.title,
		description: event.description || '',
		venue: event.venue || '',
		city: event.city || '',
		state: event.state || '',
		country: event.country || '',
		startsAt: formatDateTimeLocal(event.startsAt, event.timezone),
		endsAt: formatDateTimeLocal(event.endsAt, event.timezone),
	});
	const [images, setImages] = useState({ landscape: event.coverImageUrl || '', portrait: event.portraitImageUrl || '' });
	const [tickets, setTickets] = useState(
		(event.ticketTypes || []).map(ticket => ({
			id: ticket.id,
			name: ticket.name,
			price: String(ticket.price),
			quantity: String(ticket.quantity),
			salesEndAt: formatDateTimeLocal(ticket.salesEndAt, event.timezone),
		}))
	);

	const openEditor = () => {
		setForm({
			title: event.title,
			description: event.description || '',
			venue: event.venue || '',
			city: event.city || '',
			state: event.state || '',
			country: event.country || '',
			startsAt: formatDateTimeLocal(event.startsAt, event.timezone),
			endsAt: formatDateTimeLocal(event.endsAt, event.timezone),
		});
		setImages({ landscape: event.coverImageUrl || '', portrait: event.portraitImageUrl || '' });
		setTickets(
			(event.ticketTypes || []).map(ticket => ({
				id: ticket.id,
				name: ticket.name,
				price: String(ticket.price),
				quantity: String(ticket.quantity),
				salesEndAt: formatDateTimeLocal(ticket.salesEndAt, event.timezone),
			}))
		);
		setOpen(true);
	};

	const save = async () => {
		try {
			const nextStartsAt = form.startsAt ? dateTimeLocalToIso(form.startsAt, event.timezone) : event.startsAt;
			const nextEndsAt = form.endsAt ? dateTimeLocalToIso(form.endsAt, event.timezone) : undefined;
			const payload = {
				...form,
				...(nextStartsAt && nextStartsAt !== event.startsAt ? { startsAt: nextStartsAt } : {}),
				...(nextEndsAt !== (event.endsAt || undefined) ? { endsAt: nextEndsAt } : {}),
				coverImageUrl: images.landscape || undefined,
				portraitImageUrl: images.portrait || undefined,
				ticketTypes: tickets.map(ticket => ({
					id: ticket.id,
					name: ticket.name,
					price: Number(ticket.price),
					quantity: Number(ticket.quantity),
					salesEndAt: ticket.salesEndAt ? dateTimeLocalToIso(ticket.salesEndAt, event.timezone) : null,
				})),
			};
			delete (payload as { startsAt?: string }).startsAt;
			delete (payload as { endsAt?: string }).endsAt;
			const datePayload = {
				...payload,
				...(nextStartsAt && nextStartsAt !== event.startsAt ? { startsAt: nextStartsAt } : {}),
				...(nextEndsAt !== (event.endsAt || undefined) ? { endsAt: nextEndsAt } : {}),
			};
			await update.mutateAsync({ id: event.id, payload: datePayload });
			setOpen(false);
			push({ title: 'Event updated', description: 'The change was saved and audited.' });
		} catch (error) {
			push({ title: 'Update failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' });
		}
	};

	return (
		<>
			<button
				type='button'
				onClick={openEditor}
				className='inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white'>
				<Pencil size={15} />
				Edit event
			</button>
			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title='Edit event (admin)'
				description='Changes are validated and recorded in the audit log.'
				footer={
					<>
						<button type='button' onClick={() => setOpen(false)} className='rounded-xl border px-4 py-2 text-sm'>
							Cancel
						</button>
						<button
							type='button'
							onClick={() => void save()}
							disabled={update.isPending}
							className='rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white'>
							{update.isPending ? 'Saving...' : 'Save changes'}
						</button>
					</>
				}>
				<div className='max-h-[65vh] space-y-4 overflow-y-auto pr-1'>
					{(['title', 'venue', 'city', 'state', 'country'] as const).map(key => (
						<label key={key} className='block text-sm font-medium capitalize'>
							{key}
							<input
								value={form[key]}
								onChange={e => setForm(v => ({ ...v, [key]: e.target.value }))}
								className='mt-1 w-full rounded-lg border border-slate-200 px-3 py-2'
							/>
						</label>
					))}
					<label className='block text-sm font-medium'>
						Description
						<textarea
							value={form.description}
							onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
							className='mt-1 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2'
						/>
					</label>
					<div className='grid gap-3 sm:grid-cols-2'>
						<label className='text-sm font-medium'>
							Starts ({event.timezone || 'US Time'})
							<input
								type='datetime-local'
								value={form.startsAt}
								onChange={e => setForm(v => ({ ...v, startsAt: e.target.value }))}
								className='mt-1 w-full rounded-lg border border-slate-200 px-3 py-2'
							/>
						</label>
						<label className='text-sm font-medium'>
							Ends ({event.timezone || 'US Time'})
							<input
								type='datetime-local'
								value={form.endsAt}
								onChange={e => setForm(v => ({ ...v, endsAt: e.target.value }))}
								className='mt-1 w-full rounded-lg border border-slate-200 px-3 py-2'
							/>
						</label>
					</div>
					<div>
						<div className='mb-2 flex items-center justify-between'>
							<p className='text-sm font-semibold'>Ticket types</p>
							<span className='rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'>
								Timezone: {event.timezone || 'America/New_York'}
							</span>
						</div>
						<div className='hidden text-[11px] font-semibold text-slate-500 sm:grid sm:grid-cols-[1fr_80px_80px_175px_auto] gap-2 pb-1'>
							<span>Name</span>
							<span>Price ($)</span>
							<span>Qty</span>
							<span>Sales End ({event.timezone ? event.timezone.split('/').pop()?.replace(/_/g, ' ') : 'US'})</span>
							<span></span>
						</div>
						<div className='space-y-2'>
							{tickets.map((ticket, index) => (
								<div key={ticket.id} className='grid gap-2 sm:grid-cols-[1fr_80px_80px_175px_auto] items-center'>
									<input
										value={ticket.name}
										placeholder='Ticket Name'
										onChange={e => setTickets(v => v.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))}
										className='rounded-lg border border-slate-200 px-3 py-2 text-sm'
									/>
									<input
										type='number'
										min='0'
										step='0.01'
										placeholder='Price'
										value={ticket.price}
										onChange={e => setTickets(v => v.map((item, i) => (i === index ? { ...item, price: e.target.value } : item)))}
										className='rounded-lg border border-slate-200 px-3 py-2 text-sm'
									/>
									<input
										type='number'
										min='0'
										placeholder='Qty'
										value={ticket.quantity}
										onChange={e => setTickets(v => v.map((item, i) => (i === index ? { ...item, quantity: e.target.value } : item)))}
										className='rounded-lg border border-slate-200 px-3 py-2 text-sm'
									/>
									<input
										type='datetime-local'
										title={`Sales end date & time in ${event.timezone || 'US Time'}`}
										value={ticket.salesEndAt}
										onChange={e => setTickets(v => v.map((item, i) => (i === index ? { ...item, salesEndAt: e.target.value } : item)))}
										className='w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-primary'
									/>
									{ticket.salesEndAt ? (
										<button
											type='button'
											title='Clear expiry (sales end when event ends)'
											onClick={() => setTickets(v => v.map((item, i) => (i === index ? { ...item, salesEndAt: '' } : item)))}
											className='inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600'>
											<X size={15} />
										</button>
									) : (
										<span className='inline-flex h-8 w-8 items-center justify-center text-xs text-slate-300' title='No expiry date set'>
											—
										</span>
									)}
								</div>
							))}
						</div>
					</div>
					<div className='grid gap-3 sm:grid-cols-2'>
						{([['landscape', 'Landscape image'], ['portrait', 'Portrait image']] as const).map(([key, label]) => (
							<div key={key}>
								<p className='mb-1 text-sm font-semibold'>{label}</p>
								{images[key] ? (
									<div className='relative'>
										<img src={images[key]} alt='' className='h-32 w-full rounded-lg object-cover' />
										<button
											type='button'
											onClick={() => setImages(v => ({ ...v, [key]: '' }))}
											className='absolute right-2 top-2 rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white'>
											Delete
										</button>
									</div>
								) : (
									<FileUpload label={`Upload ${key}`} onUploadComplete={url => setImages(v => ({ ...v, [key]: url }))} />
								)}
							</div>
						))}
					</div>
				</div>
			</Modal>
		</>
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
