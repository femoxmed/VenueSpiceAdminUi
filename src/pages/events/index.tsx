import { CalendarDays, MapPin, Plus, Ticket } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { useCreateEvent, useEvents, useOrganizations, useUpdateEventStatus } from '@/features/ticketing/hooks';
import { currency } from '@/lib/utils';

const MIN_PAID_PRICE = 1;

export function EventsPage() {
	const { data: organizations = [] } = useOrganizations();
	const [organizationId, setOrganizationId] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [formError, setFormError] = useState('');
	const [form, setForm] = useState({
		title: '',
		venue: '',
		city: '',
		state: '',
		price: '0',
		quantity: '100',
		startsAt: '',
	});
	const { data: events = [], isLoading } = useEvents(organizationId);
	const createEvent = useCreateEvent();
	const updateStatus = useUpdateEventStatus();

	async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const targetOrganizationId = organizationId || organizations[0]?.id;
		if (!targetOrganizationId || !form.title || !form.startsAt) return;
		const price = Number(form.price || 0);
		const quantity = Number(form.quantity || 0);
		if (!Number.isFinite(price) || price < 0) {
			setFormError('Ticket price must be a valid non-negative amount.');
			return;
		}
		if (price > 0 && price < MIN_PAID_PRICE) {
			setFormError('Paid tickets must be at least $1.00. Use $0 for a free ticket.');
			return;
		}
		if (!Number.isFinite(quantity) || quantity < 1) {
			setFormError('Ticket quantity must be at least 1.');
			return;
		}

		await createEvent.mutateAsync({
			organizationId: targetOrganizationId,
			title: form.title,
			venue: form.venue,
			city: form.city,
			state: form.state,
			startsAt: new Date(form.startsAt).toISOString(),
			status: 'draft',
			ticketTypes: [
				{
					name: 'Regular',
					price,
					quantity,
				},
			],
		});
		setForm({ title: '', venue: '', city: '', state: '', price: '0', quantity: '100', startsAt: '' });
		setFormError('');
		setShowForm(false);
	}

	return (
		<section>
			<PageHeader
				title='Events'
				description='Create, publish, and monitor vendor events and ticket inventory.'
				action={
					<button
						type='button'
						onClick={() => setShowForm((current) => !current)}
						className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-80'>
						<Plus size={16} />
						New Event
					</button>
				}
			/>

			<div className='mb-5 flex flex-wrap gap-3'>
				<select
					value={organizationId}
					onChange={(event) => setOrganizationId(event.target.value)}
					className='rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700'>
					<option value=''>All organizations</option>
					{organizations.map((organization) => (
						<option key={organization.id} value={organization.id}>
							{organization.name}
						</option>
					))}
				</select>
			</div>

			{showForm ? (
				<form onSubmit={handleCreate} className='card mb-6 grid gap-4 p-5 md:grid-cols-3'>
					<input
						value={form.title}
						onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
						placeholder='Event title'
						className='rounded-lg border border-slate-200 px-3 py-2 text-sm'
						required
					/>
					<input
						value={form.venue}
						onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))}
						placeholder='Venue'
						className='rounded-lg border border-slate-200 px-3 py-2 text-sm'
					/>
					<input
						value={form.city}
						onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
						placeholder='City'
						className='rounded-lg border border-slate-200 px-3 py-2 text-sm'
					/>
					<input
						value={form.state}
						onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
						placeholder='State'
						className='rounded-lg border border-slate-200 px-3 py-2 text-sm'
					/>
					<input
						type='datetime-local'
						value={form.startsAt}
						onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
						className='rounded-lg border border-slate-200 px-3 py-2 text-sm'
						required
					/>
					<div className='grid grid-cols-2 gap-3'>
						<label className='block'>
							<input
								type='number'
								min='0'
								step='0.01'
								value={form.price}
								onChange={(event) => {
									setForm((current) => ({ ...current, price: event.target.value }));
									setFormError('');
								}}
								placeholder='Price'
								className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
							/>
							<span className='mt-1 block text-xs text-slate-500'>$0 is free. Paid tickets start at $1.00.</span>
						</label>
						<input
							type='number'
							min='1'
							value={form.quantity}
							onChange={(event) => {
								setForm((current) => ({ ...current, quantity: event.target.value }));
								setFormError('');
							}}
							placeholder='Qty'
							className='h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm'
						/>
					</div>
					{formError ? (
						<div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 md:col-span-3'>
							{formError}
						</div>
					) : null}
					<button
						type='submit'
						disabled={createEvent.isPending}
						className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-3'>
						{createEvent.isPending ? 'Creating...' : 'Create draft event'}
					</button>
				</form>
			) : null}

			<div className='grid gap-4 xl:grid-cols-2'>
				{isLoading ? (
					<div className='card p-6 text-sm text-slate-500'>Loading events...</div>
				) : events.length ? (
					events.map((event) => {
						const ticketCount = event.ticketTypes?.reduce((sum, ticket) => sum + Number(ticket.quantity || 0), 0) ?? 0;
						const soldCount = event.ticketTypes?.reduce((sum, ticket) => sum + Number(ticket.quantitySold || 0), 0) ?? 0;
						const lowestPrice = event.ticketTypes?.length
							? Math.min(...event.ticketTypes.map((ticket) => Number(ticket.price || 0)))
							: 0;

						return (
							<article key={event.id} className='card p-5 transition hover:-translate-y-0.5 hover:shadow-lg'>
								<div className='flex items-start justify-between gap-4'>
									<div>
										<p className='text-xs font-semibold uppercase text-secondary'>{event.organization?.name ?? 'Unassigned vendor'}</p>
										<Link to={`/events/${event.id}`} className='mt-1 block text-lg font-semibold text-slate-950 hover:text-primary'>
											{event.title}
										</Link>
									</div>
									<span className='badge bg-primary-10 text-primary'>{event.status}</span>
								</div>
								<div className='mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2'>
									<span className='inline-flex items-center gap-2'><CalendarDays size={16} />{new Date(event.startsAt).toLocaleString()}</span>
									<span className='inline-flex items-center gap-2'><MapPin size={16} />{[event.venue, event.city, event.state].filter(Boolean).join(', ') || 'Venue TBD'}</span>
									<span className='inline-flex items-center gap-2'><Ticket size={16} />{soldCount}/{ticketCount} tickets sold</span>
									<span className='font-semibold text-tertiary-80'>From {currency(lowestPrice)}</span>
								</div>
								<div className='mt-5 flex flex-wrap gap-2'>
									<Link
										to={`/events/${event.id}`}
										className='rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white'>
										View details
									</Link>
									<button
										type='button'
										onClick={() => updateStatus.mutate({ id: event.id, status: 'published' })}
										disabled={event.status === 'published' || updateStatus.isPending}
										className='rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50'>
										Publish
									</button>
									<button
										type='button'
										onClick={() => updateStatus.mutate({ id: event.id, status: 'archived' })}
										disabled={event.status === 'archived' || updateStatus.isPending}
										className='rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50'>
										Archive
									</button>
									<button
										type='button'
										onClick={() => updateStatus.mutate({ id: event.id, status: 'cancelled' })}
										disabled={event.status === 'cancelled' || updateStatus.isPending}
										className='rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50'>
										Cancel
									</button>
								</div>
							</article>
						);
					})
				) : (
					<div className='card p-6 text-sm text-slate-500'>No events yet.</div>
				)}
			</div>
		</section>
	);
}
