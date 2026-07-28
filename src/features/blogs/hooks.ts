import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBlog, deleteBlog, getBlogs, updateBlog } from './api';

export const useBlogs = () => useQuery({ queryKey: ['blogs'], queryFn: getBlogs });

export function useBlogActions() {
	const client = useQueryClient();
	const refresh = () => client.invalidateQueries({ queryKey: ['blogs'] });
	return {
		create: useMutation({ mutationFn: createBlog, onSuccess: refresh }),
		update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: FormData }) => updateBlog(id, payload), onSuccess: refresh }),
		remove: useMutation({ mutationFn: deleteBlog, onSuccess: refresh }),
	};
}
