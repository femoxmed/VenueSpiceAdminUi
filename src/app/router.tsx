import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/app/layout';
import { DashboardPage } from '@/pages/dashboard';
import { OrganizationsPage } from '@/pages/organizations';
import { OrganizationDetailPage } from '@/pages/organizations/[id]';
import { EventsPage } from '@/pages/events';
import { EventDetailPage } from '@/pages/events/[id]';
import { AgentsPage } from '@/pages/agents';
import { OrdersPage } from '@/pages/orders';
import { RevenuePage } from '@/pages/revenue';
import { RefundsPage } from '@/pages/refunds';
import { SupportTicketsPage } from '@/pages/support-tickets';
import { SupportTicketDetailPage } from '@/pages/support-tickets/[id]';
import { AnalyticsPage } from '@/pages/analytics';
import { NotificationsPage } from '@/pages/notifications';
import { UsersPage } from '@/pages/users';
import { UserDetailPage } from '@/pages/users/[id]';
import { QueuesPage } from '@/pages/queues';
import { AuditLogsPage } from '@/pages/audit-logs';
import { PlatformSettingsPage } from '@/pages/platform-settings';
import { ProductsPage } from '@/pages/products';
import { ProductCreatePage } from '@/pages/products/create';
import { ProductDetailPage } from '@/pages/products/[id]';
import { ProductEditPage } from '@/pages/products/[id]/edit';
import { BlogsPage } from '@/pages/blogs';
import { ServiceTypesPage } from '@/pages/service-types';
import { CartsPage } from '@/pages/carts';
import { LoginPage } from '@/pages/auth/login';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { RoleGuard } from '@/features/auth/role-guard';
import { Role } from '@/lib/roles';

const superAdminRoles = [Role.SUPER_ADMIN];
const ticketingAdminRoles = [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN];
const ticketingStaffRoles = [Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.ORG_ADMIN, Role.ORG_STAFF];

export const router = createBrowserRouter([
	{ path: '/login', element: <LoginPage /> },
	{
		path: '/',
		element: (
			<ProtectedRoute>
				<AppLayout />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <RoleGuard roles={ticketingStaffRoles}><DashboardPage /></RoleGuard> },
			{
				path: 'organizations',
				element: <RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}><OrganizationsPage /></RoleGuard>,
			},
			{
				path: 'organizations/:id',
				element: <RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}><OrganizationDetailPage /></RoleGuard>,
			},
			{
				path: 'events',
				element: <RoleGuard roles={ticketingStaffRoles}><EventsPage /></RoleGuard>,
			},
			{
				path: 'events/:id',
				element: <RoleGuard roles={ticketingStaffRoles}><EventDetailPage /></RoleGuard>,
			},
			{
				path: 'agents',
				element: <RoleGuard roles={ticketingAdminRoles}><AgentsPage /></RoleGuard>,
			},
			{
				path: 'orders',
				element: (
					<RoleGuard roles={ticketingStaffRoles}>
						<OrdersPage />
					</RoleGuard>
				),
			},
			{
				path: 'products',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}>
						<ProductsPage />
					</RoleGuard>
				),
			},
			{
				path: 'products/create',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}>
						<ProductCreatePage />
					</RoleGuard>
				),
			},
			{
				path: 'products/:id',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}>
						<ProductDetailPage />
					</RoleGuard>
				),
			},
			{
				path: 'products/:id/edit',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}>
						<ProductEditPage />
					</RoleGuard>
				),
			},
			{
				path: 'carts',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN]}>
						<CartsPage />
					</RoleGuard>
				),
			},
			{
				path: 'service-types',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}>
						<ServiceTypesPage />
					</RoleGuard>
				),
			},
			{
				path: 'blogs',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN, Role.WRITER]}>
						<BlogsPage />
					</RoleGuard>
				),
			},
			{
				path: 'refunds',
				element: (
					<RoleGuard roles={ticketingAdminRoles}>
						<RefundsPage />
					</RoleGuard>
				),
			},
			{
				path: 'revenue',
				element: (
					<RoleGuard roles={ticketingAdminRoles}>
						<RevenuePage />
					</RoleGuard>
				),
			},
			{
				path: 'support-tickets',
				element: (
					<RoleGuard roles={ticketingAdminRoles}>
						<SupportTicketsPage />
					</RoleGuard>
				),
			},
			{
				path: 'support-tickets/:id',
				element: (
					<RoleGuard roles={ticketingAdminRoles}>
						<SupportTicketDetailPage />
					</RoleGuard>
				),
			},
			{
				path: 'analytics',
				element: (
					<RoleGuard roles={ticketingAdminRoles}>
						<AnalyticsPage />
					</RoleGuard>
				),
			},
			{
				path: 'notifications',
				element: (
					<RoleGuard roles={ticketingAdminRoles}>
						<NotificationsPage />
					</RoleGuard>
				),
			},
			{
				path: 'users',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}>
						<UsersPage />
					</RoleGuard>
				),
			},
			{
				path: 'users/:id',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}>
						<UserDetailPage />
					</RoleGuard>
				),
			},
			{
				path: 'queues',
				element: (
					<RoleGuard roles={superAdminRoles}>
						<QueuesPage />
					</RoleGuard>
				),
			},
			{
				path: 'audit-logs',
				element: (
					<RoleGuard roles={[Role.SUPER_ADMIN, Role.PLATFORM_ADMIN, Role.ADMIN]}>
						<AuditLogsPage />
					</RoleGuard>
				),
			},
			{
				path: 'platform-settings',
				element: (
					<RoleGuard roles={superAdminRoles}>
						<PlatformSettingsPage />
					</RoleGuard>
				),
			},
			{ path: '*', element: <Navigate to='/' replace /> },
		],
	},
]);
