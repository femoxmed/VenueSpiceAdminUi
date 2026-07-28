import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	useSupportTicketWithMessages,
	useAddTicketMessage,
	useUpdateTicketStatus,
	useAssignTicket,
} from '@/features/support-tickets/hooks';
import { useUsers } from '@/features/users/hooks';
import { useServiceTypes } from '@/features/service-types/hooks';
import { useCreateServiceBooking } from '@/features/jobs/hooks';
import { useOrders } from '@/features/orders/hooks';
import { useToast } from '@/components/shared/toast-provider';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { formatDate } from '@/lib/utils';

const priorityColors: Record<string, string> = {
	low: 'bg-green-100 text-green-700',
	medium: 'bg-blue-100 text-blue-700',
	high: 'bg-orange-100 text-orange-700',
	urgent: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
	'open': 'bg-blue-100 text-blue-700',
	'in-progress': 'bg-yellow-100 text-yellow-700',
	'resolved': 'bg-green-100 text-green-700',
	'closed': 'bg-gray-100 text-gray-700',
};

const categoryColors: Record<string, string> = {
	technical: 'bg-purple-100 text-purple-700',
	billing: 'bg-green-100 text-green-700',
	order: 'bg-blue-100 text-blue-700',
	installation: 'bg-orange-100 text-orange-700',
	general: 'bg-gray-100 text-gray-700',
};

export function SupportTicketDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const { data: ticket, isLoading } = useSupportTicketWithMessages(id!);
	const { data: users } = useUsers();
	const { data: serviceTypes } = useServiceTypes();
	const { data: orders } = useOrders();
	const addMessageMutation = useAddTicketMessage();
	const updateStatusMutation = useUpdateTicketStatus();
	const assignTicketMutation = useAssignTicket();
	const createAssignment = useCreateServiceBooking();
	const { push } = useToast();
	const technicians = (users ?? []).filter((user) => user.role === 'technician');

	const [message, setMessage] = useState('');
	const [isInternalNote, setIsInternalNote] = useState(false);
	const [assignmentOpen, setAssignmentOpen] = useState(false);
	const [assignmentForm, setAssignmentForm] = useState({
		serviceTypeId: '',
		technicianId: '',
		preferredDate: '',
		issue: '',
		paidItemId: '',
	});
	const paidItems = (orders ?? [])
		.filter((order) => order.user?.id === ticket?.customer?.id && order.status === 'paid')
		.flatMap((order) =>
			(order.items ?? []).map((item) => ({
				...item,
				label: `${item.product?.name || 'Paid item'}${item.deviceSerial ? ` • ${item.deviceSerial}` : ''}`,
			})),
		);

	if (isLoading) {
		return (
			<section className='space-y-6'>
				<PageHeader title='Loading ticket...' description='Please wait' />
			</section>
		);
	}

	if (!ticket) {
		return (
			<section className='space-y-6'>
				<PageHeader
					title='Ticket not found'
					description='The requested ticket does not exist'
				/>
			</section>
		);
	}

	const handleSubmitMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim()) return;

		await addMessageMutation.mutateAsync({
			id: id!,
			data: {
				content: message,
				isInternalNote,
			},
		});

		setMessage('');
		setIsInternalNote(false);
	};

	return (
		<section className='space-y-6'>
			<div className='flex justify-between items-start'>
				<PageHeader title={ticket.subject} description='Review context, status, assignment, and conversation history.' />
				<div className='flex gap-2'>
					<button
						onClick={() => {
							setAssignmentOpen(true);
							setAssignmentForm({
								serviceTypeId: '',
								technicianId: ticket.assignedUser?.id || '',
								preferredDate: '',
								issue: ticket.description || ticket.subject,
								paidItemId: '',
							});
						}}
						className='px-4 py-2 text-sm text-white bg-emerald-600 rounded-xl hover:bg-emerald-700'>
						Schedule technician
					</button>
					<button
						onClick={() => navigate('/support-tickets')}
						className='px-4 py-2 text-sm text-gray-600 border rounded-xl hover:bg-gray-50'>
						← Back to tickets
					</button>
				</div>
			</div>

			{/* Ticket Info Cards */}
			<div className='grid md:grid-cols-3 gap-6'>
				<div className='bg-white rounded-xl border p-6 space-y-3'>
					<div className='flex flex-wrap gap-2'>
						<span
							className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
							{ticket.status}
						</span>
						<span
							className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
							{ticket.priority}
						</span>
						<span
							className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[ticket.category]}`}>
							{ticket.category}
						</span>
					</div>

					<div>
						<label className='text-xs text-gray-500 uppercase font-medium'>
							Customer
						</label>
						<p className='font-medium'>
							{ticket.customer?.fullName || 'Unknown'}
						</p>
						<p className='text-sm text-gray-500'>{ticket.customer?.email}</p>
					</div>

					{ticket.request || ticket.product || ticket.chatThreadId ? (
						<div className='space-y-2 border-t pt-3'>
							<label className='text-xs text-gray-500 uppercase font-medium'>
								Context
							</label>
							{ticket.request ? (
								<p className='text-sm text-gray-600'>
									Request: {ticket.request.serviceType?.name || ticket.request.id.slice(0, 8)}
								</p>
							) : null}
							{ticket.product ? (
								<p className='text-sm text-gray-600'>
									Product: {ticket.product.name || ticket.product.sku}
								</p>
							) : null}
							{ticket.chatThreadId ? (
								<p className='text-sm text-gray-600'>
									Chat: {ticket.chatThreadId}
								</p>
							) : null}
						</div>
					) : null}

					<div>
						<label className='text-xs text-gray-500 uppercase font-medium'>
							Assigned To
						</label>
						<select
							className='w-full rounded-lg border px-3 py-2 text-sm'
							value={ticket.assignedUser?.id || ''}
							onChange={async (e) => {
								await assignTicketMutation.mutateAsync({
									id: id!,
									assignedTo: e.target.value || null,
								});
							}}>
							<option value=''>Unassigned</option>
							{users?.map((user) => (
								<option key={user.id} value={user.id}>
									{user.fullName}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className='text-xs text-gray-500 uppercase font-medium'>
							Status
						</label>
						<select
							className='w-full rounded-lg border px-3 py-2 text-sm'
							value={ticket.status}
							onChange={async (e) => {
								await updateStatusMutation.mutateAsync({
									id: id!,
									status: e.target.value,
								});
							}}>
							<option value='open'>Open</option>
							<option value='in-progress'>In Progress</option>
							<option value='resolved'>Resolved</option>
							<option value='closed'>Closed</option>
						</select>
					</div>

					<div className='text-xs text-gray-500 pt-2 border-t'>
						Created: {formatDate(ticket.createdAt)}
					</div>
				</div>

				<div className='md:col-span-2 bg-white rounded-xl border p-6'>
					<label className='text-xs text-gray-500 uppercase font-medium mb-2 block'>
						Description
					</label>
					<p className='text-gray-700 whitespace-pre-wrap'>
						{ticket.description}
					</p>
				</div>
			</div>

			{/* Message Timeline */}
			<div className='bg-white rounded-xl border'>
				<div className='p-6 border-b'>
					<h3 className='font-medium'>Conversation</h3>
				</div>

				<div className='p-6 space-y-6 max-h-[500px] overflow-y-auto'>
					{ticket.messages?.map((msg) => (
						<div
							key={msg.id}
							className={`${msg.isInternalNote ? 'bg-amber-50 border border-amber-200 rounded-lg p-3' : ''}`}>
							<div className='flex justify-between items-start mb-2'>
								<div className='flex items-center gap-2'>
									<div className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium'>
										{msg.author?.fullName?.charAt(0).toUpperCase() || '?'}
									</div>
									<div>
										<p className='text-sm font-medium'>
											{msg.author?.fullName || 'System'}
										</p>
										<p className='text-xs text-gray-500'>
											{formatDate(msg.createdAt)}
											<span className='ml-2 uppercase tracking-wide'>
												{msg.source || 'app'}
											</span>
											{msg.isInternalNote && (
												<span className='ml-2 text-amber-700 font-medium'>
													🔒 Internal Note
												</span>
											)}
										</p>
									</div>
								</div>
							</div>
							<p className='text-gray-700 whitespace-pre-wrap pl-10'>
								{msg.content}
							</p>
						</div>
					))}

					{(!ticket.messages || ticket.messages.length === 0) && (
						<p className='text-center text-gray-500 py-8'>
							No messages yet. Start the conversation below.
						</p>
					)}
				</div>

				{/* Message Input */}
				<form onSubmit={handleSubmitMessage} className='p-6 border-t'>
					<textarea
						className='w-full rounded-xl border px-4 py-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
						placeholder={
							isInternalNote ? 'Write an internal note...' : 'Write a reply...'
						}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					/>

					<div className='flex justify-between items-center mt-4'>
						<label className='flex items-center gap-2 cursor-pointer'>
							<input
								type='checkbox'
								checked={isInternalNote}
								onChange={(e) => setIsInternalNote(e.target.checked)}
								className='w-4 h-4'
							/>
							<span className='text-sm text-gray-600'>
								Mark as internal note (only visible to admins)
							</span>
						</label>

						<button
							type='submit'
							disabled={!message.trim() || addMessageMutation.isPending}
							className='px-6 py-2 bg-secondary text-white rounded-xl text-sm font-medium disabled:opacity-50'>
							{addMessageMutation.isPending ? 'Sending...' : 'Send Message'}
						</button>
					</div>
				</form>
			</div>

			<Modal
				open={assignmentOpen}
				onClose={() => setAssignmentOpen(false)}
				title='Schedule technician'
				description='Create a technician assignment from this ticket.'
				footer={
					<div className='flex justify-end gap-2'>
						<button className='rounded-xl border border-slate-200 px-4 py-2 text-sm' onClick={() => setAssignmentOpen(false)}>Cancel</button>
						<button
							className='rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
							disabled={createAssignment.isPending}
							onClick={async () => {
								if (!ticket.customer?.id || !assignmentForm.serviceTypeId || !assignmentForm.preferredDate || !assignmentForm.issue || !assignmentForm.paidItemId) {
									push({ title: 'Missing fields', description: 'Customer paid item, service type, date, and issue are required.', variant: 'error' });
									return;
								}
								try {
									await createAssignment.mutateAsync({
										customerId: ticket.customer.id,
										serviceTypeId: assignmentForm.serviceTypeId,
										technicianId: assignmentForm.technicianId || undefined,
										paidItemId: assignmentForm.paidItemId,
										preferredDate: assignmentForm.preferredDate,
										issue: assignmentForm.issue,
										status: 'assigned',
									});
									push({ title: 'Assignment scheduled', description: 'The technician assignment has been created.' });
									setAssignmentOpen(false);
								} catch (error) {
									push({ title: 'Unable to schedule assignment', description: error instanceof Error ? error.message : 'An unexpected error occurred.', variant: 'error' });
								}
							}}>
							{createAssignment.isPending ? 'Scheduling...' : 'Schedule'}
						</button>
					</div>
				}>
				<div className='grid gap-4 md:grid-cols-2'>
					<select value={assignmentForm.serviceTypeId} onChange={(e) => setAssignmentForm((current) => ({ ...current, serviceTypeId: e.target.value }))} className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'>
						<option value=''>Select service type</option>
						{(serviceTypes ?? []).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
					</select>
					<select value={assignmentForm.technicianId} onChange={(e) => setAssignmentForm((current) => ({ ...current, technicianId: e.target.value }))} className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'>
						<option value=''>Select technician</option>
						{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.fullName ?? technician.email}</option>)}
					</select>
					<select value={assignmentForm.paidItemId} onChange={(e) => setAssignmentForm((current) => ({ ...current, paidItemId: e.target.value }))} className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2'>
						<option value=''>Select customer paid item</option>
						{paidItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
					</select>
					<input type='date' value={assignmentForm.preferredDate} onChange={(e) => setAssignmentForm((current) => ({ ...current, preferredDate: e.target.value }))} className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm' />
					<textarea value={assignmentForm.issue} onChange={(e) => setAssignmentForm((current) => ({ ...current, issue: e.target.value }))} className='min-h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2' />
				</div>
			</Modal>
		</section>
	);
}
