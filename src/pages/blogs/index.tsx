import { useMemo, useState } from 'react';
import { Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { useToast } from '@/components/shared/toast-provider';
import { useProducts } from '@/features/products/hooks';
import { useBlogActions, useBlogs } from '@/features/blogs/hooks';
import type { Blog } from '@/features/blogs/api';

const emptyForm = {
	title: '', slug: '', excerpt: '', content: '', category: 'Water & Wellness',
	status: 'draft' as Blog['status'], publishedAt: '', featuredAt: '',
	relatedProductIds: [] as string[], bannerImage: null as File | null,
	thumbnailImage: null as File | null,
};

export function BlogsPage() {
	const { data = [] } = useBlogs();
	const { data: products = [] } = useProducts();
	const actions = useBlogActions();
	const { push } = useToast();
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<Blog | null>(null);
	const [form, setForm] = useState(emptyForm);

	const close = () => { setOpen(false); setEditing(null); setForm(emptyForm); };
	const edit = (blog: Blog) => {
		setEditing(blog);
		setForm({
			...emptyForm, title: blog.title, slug: blog.slug, excerpt: blog.excerpt,
			content: blog.content, category: blog.category, status: blog.status,
			publishedAt: blog.publishedAt?.slice(0, 16) || '',
			featuredAt: blog.featuredAt?.slice(0, 16) || '',
			relatedProductIds: blog.relatedProducts?.map((item) => item.id) || [],
		});
		setOpen(true);
	};

	const submit = async () => {
		const payload = new FormData();
		Object.entries(form).forEach(([key, value]) => {
			if (key === 'relatedProductIds') payload.append(key, JSON.stringify(value));
			else if (value instanceof File) payload.append(key, value);
			else if (value) payload.append(key, String(value));
		});
		try {
			if (editing) await actions.update.mutateAsync({ id: editing.id, payload });
			else await actions.create.mutateAsync(payload);
			push({ title: editing ? 'Story updated' : 'Story created', description: 'Your editorial changes are live in the CMS.' });
			close();
		} catch (error) {
			push({ title: 'Unable to save story', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' });
		}
	};

	const columns = useMemo<ColumnDef<Blog>[]>(() => [
		{ key: 'story', header: 'Story', searchValue: (row) => `${row.title} ${row.category}`, render: (row) => (
			<div className='flex items-center gap-3'>
				<div className='h-14 w-20 overflow-hidden rounded-xl bg-slate-100'>
					{row.thumbnailImage?.url && <img src={row.thumbnailImage.url} className='h-full w-full object-cover' />}
				</div>
				<div><p className='font-semibold text-slate-900'>{row.title}</p><p className='text-xs text-slate-500'>{row.category}</p></div>
			</div>
		)},
		{ key: 'author', header: 'Written by', render: (row) => row.author?.fullName || 'Aquzera Editorial' },
		{ key: 'status', header: 'Status', render: (row) => <span className='badge bg-blue-50 capitalize text-blue-700'>{row.status}</span> },
		{ key: 'read', header: 'Read time', render: (row) => `${row.readTimeMinutes} min` },
		{ key: 'actions', header: '', render: (row) => (
			<div className='flex gap-1'>
				<a href={`${window.location.origin.replace(/:\d+$/, ':3000')}/blog/${row.slug}`} target='_blank' className='rounded-lg p-2 text-slate-500 hover:bg-slate-100'><Eye size={16} /></a>
				<button onClick={() => edit(row)} className='rounded-lg p-2 text-blue-600 hover:bg-blue-50'><Edit3 size={16} /></button>
				<button onClick={async () => { if (confirm(`Delete "${row.title}"?`)) await actions.remove.mutateAsync(row.id); }} className='rounded-lg p-2 text-red-600 hover:bg-red-50'><Trash2 size={16} /></button>
			</div>
		)},
	], [actions.remove]);

	return <section className='space-y-6'>
		<PageHeader title='Blog CMS' description='Shape thoughtful stories around water, wellness, design, and daily living.' />
		<DataTable rows={data} columns={columns} searchPlaceholder='Search stories or categories' actions={
			<button onClick={() => setOpen(true)} className='flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white'><Plus size={16} /> New story</button>
		} />
		<Modal open={open} onClose={close} title={editing ? 'Edit story' : 'Create a story'} description='Write clearly, use strong imagery, and make every detail intentional.'
			footer={<><button onClick={close} className='rounded-xl border px-4 py-2 text-sm'>Cancel</button><button onClick={submit} className='rounded-xl bg-secondary px-5 py-2 text-sm font-medium text-white'>Save story</button></>}>
			<div className='grid gap-5 md:grid-cols-2'>
				<label className='md:col-span-2 text-sm font-medium'>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} className='mt-2 w-full rounded-xl border px-3 py-2' /></label>
				<label className='text-sm font-medium'>Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className='mt-2 w-full rounded-xl border px-3 py-2' /></label>
				<label className='text-sm font-medium'>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className='mt-2 w-full rounded-xl border px-3 py-2' /></label>
				<label className='md:col-span-2 text-sm font-medium'>Excerpt<textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className='mt-2 min-h-24 w-full rounded-xl border px-3 py-2' /></label>
				<label className='md:col-span-2 text-sm font-medium'>Article content<textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className='mt-2 min-h-72 w-full rounded-xl border px-3 py-2 font-mono text-sm' placeholder='Use plain text with blank lines between paragraphs.' /></label>
				<label className='text-sm font-medium'>Thumbnail image<input type='file' accept='image/*' onChange={(e) => setForm({ ...form, thumbnailImage: e.target.files?.[0] || null })} className='mt-2 block w-full text-sm' /></label>
				<label className='text-sm font-medium'>Banner image<input type='file' accept='image/*' onChange={(e) => setForm({ ...form, bannerImage: e.target.files?.[0] || null })} className='mt-2 block w-full text-sm' /></label>
				<label className='text-sm font-medium'>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Blog['status'] })} className='mt-2 w-full rounded-xl border px-3 py-2'><option value='draft'>Draft</option><option value='published'>Published</option><option value='archived'>Archived</option></select></label>
				<label className='text-sm font-medium'>Featured at<input type='datetime-local' value={form.featuredAt} onChange={(e) => setForm({ ...form, featuredAt: e.target.value })} className='mt-2 w-full rounded-xl border px-3 py-2' /></label>
				<fieldset className='md:col-span-2'><legend className='mb-2 text-sm font-medium'>Related products</legend><div className='grid max-h-40 gap-2 overflow-auto rounded-xl border p-3 md:grid-cols-2'>{products.map((product) => <label key={product.id} className='flex items-center gap-2 text-sm'><input type='checkbox' checked={form.relatedProductIds.includes(product.id)} onChange={() => setForm({ ...form, relatedProductIds: form.relatedProductIds.includes(product.id) ? form.relatedProductIds.filter((id) => id !== product.id) : [...form.relatedProductIds, product.id] })} />{product.name}</label>)}</div></fieldset>
			</div>
		</Modal>
	</section>;
}
