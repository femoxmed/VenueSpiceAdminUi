import { Link2, Plus, UserRoundCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { useAgents } from '@/features/ticketing/hooks';

export function AgentsPage() {
	const { data: agents = [], isLoading } = useAgents();

	return (
		<section>
			<PageHeader
				title='Agents & Referrals'
				description='Track promoters, referral codes, and attributed ticket sales.'
				action={
					<button className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-80'>
						<Plus size={16} />
						New Agent
					</button>
				}
			/>

			<div className='grid gap-4 lg:grid-cols-2 xl:grid-cols-3'>
				{isLoading ? (
					<div className='card p-6 text-sm text-slate-500'>Loading agents...</div>
				) : agents.length ? (
					agents.map((agent) => (
						<article key={agent.id} className='card p-5'>
							<div className='flex items-start justify-between gap-4'>
								<div className='flex items-center gap-3'>
									<div className='grid h-11 w-11 place-items-center rounded-lg bg-secondary-10 text-secondary'>
										<UserRoundCheck size={20} />
									</div>
									<div>
										<h3 className='font-semibold text-slate-950'>{agent.fullName}</h3>
										<p className='text-sm text-slate-500'>{agent.email}</p>
									</div>
								</div>
								<span className='badge bg-tertiary-10 text-tertiary-80'>{agent.status}</span>
							</div>
							<p className='mt-4 text-sm text-slate-500'>{agent.organization?.name ?? 'No organization assigned'}</p>
							<div className='mt-4 space-y-2'>
								{agent.referralCodes?.length ? (
									agent.referralCodes.map((code) => (
										<div key={code.id} className='flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm'>
											<span className='inline-flex items-center gap-2 font-medium text-slate-800'><Link2 size={14} />{code.code}</span>
											<span className='text-slate-500'>{code.usesCount} uses</span>
										</div>
									))
								) : (
									<p className='text-sm text-slate-500'>No referral code yet.</p>
								)}
							</div>
						</article>
					))
				) : (
					<div className='card p-6 text-sm text-slate-500'>No agents yet.</div>
				)}
			</div>
		</section>
	);
}
