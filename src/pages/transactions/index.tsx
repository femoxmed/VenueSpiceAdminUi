import { CreditCard, DollarSign, ReceiptText } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/data-table';
import { MetricCard } from '@/components/shared/metric-card';
import { PageHeader } from '@/components/shared/page-header';
import { usePaymentIntents } from '@/features/payments/hooks';
import type { PaymentIntentRow } from '@/features/payments/api';

export function TransactionsPage() {
	const { data: transactions = [], isLoading } = usePaymentIntents();
	const succeeded = transactions.filter((transaction) => transaction.status === 'succeeded');
	const grossTotal = succeeded.reduce((sum, transaction) => sum + Number(transaction.total || transaction.amount || 0), 0);
	const taxTotal = succeeded.reduce((sum, transaction) => sum + Number(transaction.tax || 0), 0);
	const feeTotal = succeeded.reduce(
		(sum, transaction) => sum + Number(transaction.platformFee || 0) + Number(transaction.processingFee || 0),
		0,
	);

	const columns: ColumnDef<PaymentIntentRow>[] = [
		{
			key: 'date',
			header: 'Date',
			render: (row) => formatDate(row.paidAt || row.createdAt),
			searchValue: (row) => `${row.paidAt || ''} ${row.createdAt || ''}`,
			sortValue: (row) => row.paidAt || row.createdAt || '',
		},
		{
			key: 'customer',
			header: 'Customer',
			render: (row) => row.customerEmail,
			searchValue: (row) => row.customerEmail,
		},
		{
			key: 'provider',
			header: 'Provider',
			render: (row) => <StatusPill label={row.provider} />,
			searchValue: (row) => row.provider,
		},
		{
			key: 'status',
			header: 'Status',
			render: (row) => <StatusPill label={row.status} tone={row.status === 'succeeded' ? 'green' : row.status === 'failed' ? 'red' : 'yellow'} />,
			searchValue: (row) => row.status,
		},
		{
			key: 'invoice',
			header: 'Invoice',
			render: (row) => row.invoice?.invoiceNumber || '-',
			searchValue: (row) => row.invoice?.invoiceNumber || '',
		},
		{
			key: 'subtotal',
			header: 'Subtotal',
			render: (row) => currency(row.subtotal || 0, row.currency),
			sortValue: (row) => Number(row.subtotal || 0),
		},
		{
			key: 'tax',
			header: 'Tax',
			render: (row) => currency(row.tax || 0, row.currency),
			sortValue: (row) => Number(row.tax || 0),
		},
		{
			key: 'platformFee',
			header: 'Platform Fee',
			render: (row) => currency(row.platformFee || 0, row.currency),
			sortValue: (row) => Number(row.platformFee || 0),
		},
		{
			key: 'processingFee',
			header: 'Processing Fee',
			render: (row) => currency(row.processingFee || 0, row.currency),
			sortValue: (row) => Number(row.processingFee || 0),
		},
		{
			key: 'total',
			header: 'Total',
			render: (row) => currency(row.total || row.amount || 0, row.currency),
			sortValue: (row) => Number(row.total || row.amount || 0),
		},
		{
			key: 'reference',
			header: 'Reference',
			render: (row) => <span className='font-mono text-xs'>{row.providerReference}</span>,
			searchValue: (row) => row.providerReference,
		},
	];

	return (
		<div>
			<PageHeader
				title='Transactions'
				description='Review payment records, tax collected, platform fees, processing fees, and final charged totals.'
			/>

			<div className='mt-6 grid gap-4 md:grid-cols-3'>
				<MetricCard title='Successful Volume' value={currency(grossTotal)} helper={`${succeeded.length} successful payments`} icon={<DollarSign size={22} />} />
				<MetricCard title='Tax Recorded' value={currency(taxTotal)} helper='Captured from invoice or Stripe tax totals' icon={<ReceiptText size={22} />} />
				<MetricCard title='Fees Recorded' value={currency(feeTotal)} helper='Platform + processing fee snapshots' icon={<CreditCard size={22} />} />
			</div>

			<div className='mt-6'>
				<DataTable
					rows={transactions}
					columns={columns}
					pageSize={10}
					searchPlaceholder='Search transactions by customer, invoice, status, provider, or reference'
					actions={<span className='text-sm text-slate-500'>{isLoading ? 'Loading...' : `${transactions.length} transactions`}</span>}
				/>
			</div>
		</div>
	);
}

function currency(value: number | string, currencyCode = 'USD') {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currencyCode || 'USD',
		currencyDisplay: 'code',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(value || 0));
}

function formatDate(value?: string | null) {
	if (!value) return '-';
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

function StatusPill({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'green' | 'yellow' | 'red' }) {
	const classes = {
		blue: 'bg-blue-50 text-blue-700',
		green: 'bg-emerald-50 text-emerald-700',
		yellow: 'bg-amber-50 text-amber-700',
		red: 'bg-rose-50 text-rose-700',
	};
	return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${classes[tone]}`}>{label}</span>;
}
