import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type ColumnDef<T> = {
	key: string;
	header: string;
	render: (row: T) => React.ReactNode;
	searchValue?: (row: T) => string;
	sortValue?: (row: T) => string | number | boolean | Date | null | undefined;
	sortable?: boolean;
};

type DataTableProps<T> = {
	title?: string;
	searchPlaceholder?: string;
	rows: T[];
	columns: ColumnDef<T>[];
	pageSize?: number;
	actions?: ReactNode;
	filters?: ReactNode;
};

export function DataTable<T>({
	rows,
	columns,
	pageSize = 8,
	searchPlaceholder = 'Search...',
	actions,
	filters,
}: DataTableProps<T>) {
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState<{
		key: string;
		direction: 'asc' | 'desc';
	} | null>(null);

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return rows;
		return rows.filter((row) =>
			columns.some((column) =>
				(column.searchValue?.(row) ?? '').toLowerCase().includes(term),
			),
		);
	}, [columns, rows, search]);

	const sorted = useMemo(() => {
		if (!sort) return filtered;
		const column = columns.find((item) => item.key === sort.key);
		if (!column) return filtered;

		return [...filtered].sort((a, b) => {
			const aValue = getSortValue(column, a);
			const bValue = getSortValue(column, b);
			const result = compareSortValues(aValue, bValue);
			return sort.direction === 'asc' ? result : -result;
		});
	}, [columns, filtered, sort]);

	const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
	const currentPage = Math.min(page, totalPages);
	const sliced = sorted.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);

	const toggleSort = (column: ColumnDef<T>) => {
		const canSort = column.sortable !== false && (column.sortValue || column.searchValue);
		if (!canSort) return;
		setPage(1);
		setSort((current) => {
			if (current?.key !== column.key) {
				return { key: column.key, direction: 'asc' };
			}
			if (current.direction === 'asc') {
				return { key: column.key, direction: 'desc' };
			}
			return null;
		});
	};

	return (
		<div className='table-shell'>
			<div className='flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between'>
				<div className='flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 lg:flex-nowrap'>
					<input
						value={search}
						onChange={(event) => {
							setSearch(event.target.value);
							setPage(1);
						}}
						placeholder={searchPlaceholder}
						className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-secondary sm:max-w-sm lg:w-80'
					/>
					{filters}
				</div>
				<div className='flex shrink-0 items-center gap-3'>
					<div className='text-sm text-slate-500'>
						Showing {sliced.length} of {filtered.length} records
					</div>
					{actions}
				</div>
			</div>

			<div className='table-base overflow-x-auto'>
				<table>
					<thead>
						<tr>
							{columns.map((column) => (
								<th key={column.key}>
									<button
										type='button'
										onClick={() => toggleSort(column)}
										disabled={column.sortable === false || (!column.sortValue && !column.searchValue)}
										className='inline-flex items-center gap-1.5 disabled:cursor-default'>
										{column.header}
										{column.sortable === false || (!column.sortValue && !column.searchValue) ? null : sort?.key === column.key ? (
											sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
										) : (
											<ArrowUpDown size={13} className='text-slate-400' />
										)}
									</button>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{sliced.map((row, rowIndex) => (
							<tr key={rowIndex}>
								{columns.map((column) => (
									<td key={column.key}>{column.render(row)}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className='flex items-center justify-between border-t border-slate-200 px-4 py-4'>
				<p className='text-sm text-slate-500'>
					Page {currentPage} of {totalPages}
				</p>
				<div className='flex gap-2'>
					<button
						disabled={currentPage <= 1}
						onClick={() => setPage((value) => Math.max(1, value - 1))}
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50'>
						Previous
					</button>
					<button
						disabled={currentPage >= totalPages}
						onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
						className='rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50'>
						Next
					</button>
				</div>
			</div>
		</div>
	);
}

function getSortValue<T>(column: ColumnDef<T>, row: T) {
	return column.sortValue?.(row) ?? column.searchValue?.(row) ?? '';
}

function compareSortValues(
	aValue: string | number | boolean | Date | null | undefined,
	bValue: string | number | boolean | Date | null | undefined,
) {
	if (aValue === bValue) return 0;
	if (aValue === null || aValue === undefined || aValue === '') return 1;
	if (bValue === null || bValue === undefined || bValue === '') return -1;

	if (aValue instanceof Date || bValue instanceof Date) {
		return new Date(aValue as string | number | Date).getTime() - new Date(bValue as string | number | Date).getTime();
	}

	if (typeof aValue === 'number' && typeof bValue === 'number') {
		return aValue - bValue;
	}

	if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
		return Number(aValue) - Number(bValue);
	}

	return String(aValue).localeCompare(String(bValue), undefined, {
		numeric: true,
		sensitivity: 'base',
	});
}
