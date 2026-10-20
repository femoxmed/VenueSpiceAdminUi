import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import { StatusBadge } from './status-badge';

type PurchaseHistory = {
  page: number;
  pageSize: number;
  total: number;
  orders: Array<{
    id: string;
    createdAt: string;
    status: string;
    event: { id: string; title: string };
    currency: string;
    total: number | string;
    tax: number | string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    items: Array<{ name: string; quantity: number }>;
  }>;
};

export function UserPurchaseHistory({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['user-purchase-history', authStore.getUser()?.id, userId, page],
    queryFn: () => apiClient<PurchaseHistory>(`/ticket-orders/customers/${userId}/orders`, { query: { page } }),
  });

  return (
    <section className='card min-w-0 p-6' aria-labelledby='purchase-history-title'>
      <h2 id='purchase-history-title' className='text-lg font-semibold text-slate-950'>Purchase history</h2>
      <p className='mt-2 text-sm text-slate-500'>Ticket orders linked to this account, including pending, refunded, and cancelled orders. Previous guest purchases appear after the customer claims them. Contact details below reflect each purchase.</p>
      {isPending ? <p className='mt-5 text-sm text-slate-500'>Loading purchases...</p> : isError ? (
        <p role='alert' className='mt-5 text-sm text-rose-600'>Unable to load purchase history. <button type='button' className='underline' onClick={() => refetch()}>Retry</button></p>
      ) : data ? (
        <>
          <p className='mt-5 text-sm font-medium text-slate-700'>{data.total} {data.total === 1 ? 'order' : 'orders'} linked to this account</p>
          {data.orders.length ? (
            <div className='mt-4 overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead><tr>{['Event / Order', 'Purchased', 'Tickets', 'Buyer details', 'Status', 'Total', 'Tax included'].map(label => <th key={label} className='border-b p-3 font-semibold text-slate-600'>{label}</th>)}</tr></thead>
                <tbody>{data.orders.map(order => (
                  <tr key={order.id} className='border-b align-top'>
                    <td className='p-3'><p className='font-medium'>{order.event.title}</p><p className='mt-1 break-all text-xs text-slate-500'>{order.id}</p></td>
                    <td className='whitespace-nowrap p-3'>{new Date(order.createdAt).toLocaleString()}</td>
                    <td className='p-3'>{order.items.length ? order.items.map((item, index) => <p key={index}>{item.quantity} × {item.name}</p>) : '—'}</td>
                    <td className='p-3'><p>{order.customerName}</p><p className='break-all text-slate-500'>{order.customerEmail}</p><p className='text-slate-500'>{order.customerPhone || 'No phone recorded'}</p></td>
                    <td className='p-3'><StatusBadge value={order.status} /></td>
                    <td className='whitespace-nowrap p-3'>{order.currency} {Number(order.total).toFixed(2)}</td>
                    <td className='whitespace-nowrap p-3'>{order.currency} {Number(order.tax).toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
              <p className='mt-3 text-xs text-slate-500'>Totals show the original order amount, before any refunds. Tax is included in the total.</p>
            </div>
          ) : <p className='mt-4 text-sm text-slate-500'>No purchases on this page.</p>}
          {data.total > data.pageSize || page > 1 ? (
            <div className='mt-5 flex items-center gap-4'>
              <button type='button' disabled={page === 1} onClick={() => setPage(current => current - 1)} className='rounded-lg border px-3 py-2 text-sm disabled:opacity-40'>Previous</button>
              <span className='text-sm'>Page {page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
              <button type='button' disabled={page * data.pageSize >= data.total} onClick={() => setPage(current => current + 1)} className='rounded-lg border px-3 py-2 text-sm disabled:opacity-40'>Next</button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
