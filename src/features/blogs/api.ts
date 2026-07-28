import { apiClient } from '@/lib/api-client';

export type Blog = {
	id: string;
	title: string;
	slug: string;
	excerpt: string;
	content: string;
	category: string;
	status: 'draft' | 'published' | 'archived';
	publishedAt?: string | null;
	featuredAt?: string | null;
	readTimeMinutes: number;
	author?: { id: string; fullName: string };
	bannerImage?: { url?: string } | null;
	thumbnailImage?: { url?: string } | null;
	relatedProducts?: Array<{ id: string; name: string }>;
	createdAt: string;
};

export const getBlogs = () => apiClient<Blog[]>('/blogs');
export const createBlog = (payload: FormData) => apiClient<Blog>('/blogs', { method: 'POST', body: payload });
export const updateBlog = (id: string, payload: FormData) => apiClient<Blog>(`/blogs/${id}`, { method: 'PATCH', body: payload });
export const deleteBlog = (id: string) => apiClient<{ deleted: boolean }>(`/blogs/${id}`, { method: 'DELETE' });
