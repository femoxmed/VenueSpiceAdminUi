import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';

type CustomerRow = {email:string;name:string;phone?:string;buyerUserId?:string;currency:string;paidOrders?:number;paidTotal?:string;lastPurchase?:string;id?:string;event?:string;status?:string;total?:string;createdAt?:string};
export default function CustomerPurchases({organizationId,enabled=true,cacheKey='admin'}:{organizationId?:string;enabled?:boolean;cacheKey?:string}){
 const [selected,setSelected]=useState(''),[page,setPage]=useState(1);
 const query=useQuery({queryKey:['customer-purchases',authStore.getUser()?.id,cacheKey,organizationId,selected,page],queryFn:async()=>await apiClient<CustomerRow[]>('/ticket-orders/customers',{query:{organizationId,email:selected||undefined,page}}),enabled});
 return <section className='mt-6 rounded-xl border border-slate-200 bg-white p-4'>
  <h2 className='text-xl font-bold'>Ticket customers</h2><p className='mt-2 text-sm text-slate-600'>Paid purchase totals are grouped by customer email and currency, before refunds. Select a customer to see their order history. Guest purchases remain visible.</p>
  {selected?<button className='my-3 underline' onClick={()=>{setSelected('');setPage(1);}}>Back to customers</button>:null}
  {!enabled?<p className='mt-4'>Select an organization to view customers.</p>:query.isPending?<p className='mt-4'>Loading…</p>:query.isError?<p role='alert' className='mt-4 text-red-600'>Unable to load customers. <button className='underline' onClick={()=>query.refetch()}>Retry</button></p>:null}
  <div className='mt-4 overflow-x-auto'><table className='w-full text-left text-sm'><thead><tr>{(selected?['Event / Order','Customer','Status','Total']:['Customer','Account','Paid orders','Paid total','Last purchase']).map(label=><th key={label} className='border-b p-2'>{label}</th>)}</tr></thead><tbody>{query.data?.map((row,i)=><tr key={row.id||`${row.email}-${row.currency}-${i}`} className='border-b'>{selected?<><td className='p-2'>{row.event}<div className='text-xs text-slate-500'>{row.id}</div></td><td className='p-2'>{row.name}<div>{row.email}</div><div>{row.phone}</div></td><td className='p-2'>{row.status}</td><td className='p-2'>{row.currency} {Number(row.total||0).toFixed(2)}</td></>:<><td className='p-2'><button className='text-blue-600 underline' onClick={()=>{setSelected(row.email);setPage(1);}}>{row.name||row.email}</button><div>{row.email}</div><div className='text-xs'>{row.phone}</div></td><td className='p-2'>{row.buyerUserId?'Linked account':'Guest'}</td><td className='p-2'>{row.paidOrders}</td><td className='p-2'>{row.currency} {Number(row.paidTotal||0).toFixed(2)}</td><td className='p-2'>{row.lastPurchase?new Date(row.lastPurchase).toLocaleDateString():'—'}</td></>}</tr>)}</tbody></table></div>
  {query.data?.length===0?<p className='mt-4'>No purchases found.</p>:null}
  <div className='mt-4 flex gap-3'><button disabled={page===1} className='rounded border px-3 py-2 disabled:opacity-40' onClick={()=>setPage(p=>p-1)}>Previous</button><span className='py-2'>Page {page}</span><button disabled={(query.data?.length||0)<50} className='rounded border px-3 py-2 disabled:opacity-40' onClick={()=>setPage(p=>p+1)}>Next</button></div>
 </section>;
}
