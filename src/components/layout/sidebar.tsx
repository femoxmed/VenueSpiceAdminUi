import { NavLink } from 'react-router-dom';
import {
	LayoutDashboard,
	Users,
	ShoppingCart,
	Server,
	Receipt,
	Wallet,
	CreditCard,
	LifeBuoy,
	BarChart3,
	Bell,
	Building2,
	CalendarDays,
	UserRoundCheck,
	Package,
	Newspaper,
	Wrench,
	ShieldCheck,
	Settings,
} from 'lucide-react';
import { authStore } from '@/lib/auth-store';
import { Role } from '@/lib/roles';
import { cn } from '@/lib/utils';

const items = [
	{
		to: '/',
		label: 'Dashboard',
		icon: LayoutDashboard,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN, Role.ORG_STAFF],
	},
	{
		to: '/organizations',
		label: 'Organizations',
		icon: Building2,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN],
	},
	{
		to: '/events',
		label: 'Events',
		icon: CalendarDays,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN, Role.ORG_STAFF],
	},
	{
		to: '/agents',
		label: 'Agents',
		icon: UserRoundCheck,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN],
	},
	{
		to: '/orders',
		label: 'Orders & Tickets',
		icon: ShoppingCart,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN, Role.ORG_STAFF],
	},
	{
		to: '/products',
		label: 'Products',
		icon: Package,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN],
	},
	{
		to: '/carts',
		label: 'Carts',
		icon: ShoppingCart,
		roles: [Role.SUPER_ADMIN],
	},
	{
		to: '/service-types',
		label: 'Service Types',
		icon: Wrench,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN],
	},
	{
		to: '/blogs',
		label: 'Blog CMS',
		icon: Newspaper,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.WRITER],
	},
	{
		to: '/refunds',
		label: 'Refunds',
		icon: Receipt,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN],
	},
	{
		to: '/revenue',
		label: 'Revenue',
		icon: Wallet,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN],
	},
	{
		to: '/transactions',
		label: 'Transactions',
		icon: CreditCard,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN],
	},
	{
		to: '/support-tickets',
		label: 'Support',
		icon: LifeBuoy,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN],
	},
	{
		to: '/analytics',
		label: 'Analytics',
		icon: BarChart3,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN],
	},
	{
		to: '/notifications',
		label: 'Notifications',
		icon: Bell,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN],
	},
	{
		to: '/users',
		label: 'Users',
		icon: Users,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN],
	},
	{
		to: '/queues',
		label: 'Queues',
		icon: Server,
		roles: [Role.SUPER_ADMIN],
	},
	{
		to: '/audit-logs',
		label: 'Audit Logs',
		icon: ShieldCheck,
		roles: [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN],
	},
	{
		to: '/platform-settings',
		label: 'Settings',
		icon: Settings,
		roles: [Role.SUPER_ADMIN],
	},
];

export function Sidebar() {
	const role = authStore.getRole();

	return (
		<aside className='hidden w-72 shrink-0 border-r border-primary-20 bg-white lg:block'>
			<div className='flex h-20 items-center gap-3 bg-slate-950 px-6'>
				<img
					src='/brand/venue_spice_logo.png'
					alt='Venue Spice'
					className='h-10 w-auto object-contain'
				/>
				<span className='text-xl font-extrabold tracking-wide text-white'>Venue Spice</span>
			</div>

			<nav className='space-y-1 px-4 py-4'>
				{items
					.filter((item) => role && item.roles.includes(role as Role))
					.map((item) => {
						const Icon = item.icon;
						return (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.to === '/'}
								className={({ isActive }) =>
									cn(
										'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition',
										isActive
											? 'bg-primary text-white shadow-sm'
											: 'text-slate-600 hover:bg-primary-10 hover:text-primary',
									)
								}>
								<Icon size={18} />
								{item.label}
							</NavLink>
						);
					})}
			</nav>
		</aside>
	);
}
