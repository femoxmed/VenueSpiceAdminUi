import { Bell, Mail, Server } from 'lucide-react';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';

export function NotificationsPage() {
	const queue = { waiting: 0, active: 0, status: 'unknown' };

	return (
		<section>
			<PageHeader
				title='Notifications'
				description='Monitor ticket confirmations, vendor alerts, referral updates, password resets, and support messages.'
			/>
			<div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
				<MetricCard title='Queued Messages' value={String(queue.waiting)} helper='Email jobs waiting to be delivered' icon={<Bell size={22} />} />
				<MetricCard title='Active Delivery' value={String(queue.active)} helper='Workers sending platform notifications' icon={<Mail size={22} />} />
				<MetricCard title='Queue Health' value={String(queue.status)} helper='Redis-backed notification worker status' icon={<Server size={22} />} />
			</div>
		</section>
	);
}
