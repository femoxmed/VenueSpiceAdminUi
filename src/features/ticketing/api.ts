import { apiClient } from '@/lib/api-client';

export type Organization = {
	id: string;
	name: string;
	slug: string;
	status: string;
	type?: 'vendor' | 'organization' | 'influencer';
	ownerUserId?: string | null;
	contactEmail?: string | null;
	contactPhone?: string | null;
	businessCategory?: string | null;
	country?: string | null;
	postalCode?: string | null;
	influencerPlatform?: string | null;
	influencerHandle?: string | null;
	influencerProfileUrl?: string | null;
	influencerNiche?: string | null;
	influencerAudienceSize?: number | null;
	influencerEngagementRate?: number | null;
	description?: string | null;
	stripeAccountId?: string | null;
	stripeAccountType?: 'express' | 'custom' | 'standard' | null;
	stripeChargesEnabled?: boolean;
	stripePayoutsEnabled?: boolean;
	stripeDetailsSubmitted?: boolean;
	stripeOnboardingCompletedAt?: string | null;
	createdAt: string;
};

export type TicketType = {
	id: string;
	name: string;
	price: number;
	quantity: number;
	quantitySold: number;
	status: string;
};

export type Event = {
	id: string;
	title: string;
	slug: string;
	status: string;
	description?: string | null;
	category?: string | null;
	organizerName?: string | null;
	venue?: string | null;
	country?: string | null;
	city?: string | null;
	state?: string | null;
	streetAddress?: string | null;
	timezone?: string | null;
	isVirtual?: boolean;
	startsAt: string;
	endsAt?: string | null;
	coverImageUrl?: string | null;
	imageUrls?: string[];
	socialLinks?: Record<string, string>;
	appearances?: Array<Record<string, unknown>>;
	addOns?: Array<Record<string, unknown>>;
	organization?: Organization;
	ticketTypes?: TicketType[];
	createdAt?: string;
	updatedAt?: string;
};

export type Agent = {
	id: string;
	fullName: string;
	email: string;
	status: string;
	organization?: Organization;
	referralCodes?: Array<{ id: string; code: string; usesCount: number; status: string }>;
};

export const ticketingApi = {
	organizations: () => apiClient<Organization[]>('/organizations'),
	organization: (id: string) => apiClient<Organization>(`/organizations/${id}`),
	createOrganization: (payload: OrganizationPayload) =>
		apiClient<Organization>('/organizations', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	updateOrganization: (id: string, payload: Partial<OrganizationPayload>) =>
		apiClient<Organization>(`/organizations/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(payload),
		}),
	events: (organizationId?: string) =>
		apiClient<Event[]>('/events', { query: { organizationId } }),
	createEvent: (payload: CreateEventPayload) =>
		apiClient<Event>('/events', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	updateEventStatus: (id: string, status: Event['status']) =>
		apiClient<Event>(`/events/${id}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ status }),
		}),
	agents: () => apiClient<Agent[]>('/agents'),
};

export type OrganizationPayload = {
	name: string;
	slug?: string;
	type?: 'vendor' | 'organization' | 'influencer';
	ownerUserId?: string;
	contactEmail?: string;
	contactPhone?: string;
	businessCategory?: string;
	country?: string;
	postalCode?: string;
	influencerPlatform?: string;
	influencerHandle?: string;
	influencerProfileUrl?: string;
	influencerNiche?: string;
	influencerAudienceSize?: number;
	influencerEngagementRate?: number;
	description?: string;
};

export type CreateEventPayload = {
	organizationId: string;
	title: string;
	description?: string;
	category?: string;
	organizerName?: string;
	venue?: string;
	city?: string;
	state?: string;
	country?: string;
	startsAt: string;
	endsAt?: string;
	coverImageUrl?: string;
	status?: 'draft' | 'published' | 'cancelled' | 'archived';
	ticketTypes?: Array<{
		name: string;
		price: number;
		quantity: number;
	}>;
};
