import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/shared/modal';
import { getAdminRefundPreview, getRefundReconciliation, issueAdminRefund, type AdminRefundPreview, type RefundReason, type ReconciliationReport } from '@/features/refunds/api';

const money=(amount:number,currency:string)=>new Intl.NumberFormat('en-US',{style:'currency',currency}).format(amount);
const button='rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50';
const input='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
const errorText=(error:unknown)=>error instanceof Error?error.message:'Request failed. Please try again.';

export function AdminRefundTools() {
 const queryClient=useQueryClient();
 const [report,setReport]=useState<ReconciliationReport|null>(null);
 const [reportBusy,setReportBusy]=useState(false),[reportError,setReportError]=useState('');
 const [attention,setAttention]=useState(false);
 const [open,setOpen]=useState(false),[orderId,setOrderId]=useState(''),[reason,setReason]=useState('');
 const [cancellationReason,setCancellationReason]=useState<RefundReason>('voluntary');
 const [preview,setPreview]=useState<AdminRefundPreview|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[confirmed,setConfirmed]=useState(false),[result,setResult]=useState('');
 async function loadReport(page:number) {
  setReportBusy(true);setReportError('');
  try {setReport(await getRefundReconciliation(page));}catch(e){setReportError(errorText(e));}finally{setReportBusy(false);}
 }
 async function loadPreview() {
  setBusy(true);setError('');setPreview(null);setConfirmed(false);
  try{setPreview(await getAdminRefundPreview(orderId.trim(),cancellationReason));}catch(e){setError(errorText(e));}finally{setBusy(false);}
 }
 async function issue() {
  if(!preview || !confirmed || busy)return;
  setBusy(true);setError('');
  try {
   const response=await issueAdminRefund(preview.orderId,reason.trim(),preview.refundAmount,preview.cancellationReason);
   setResult(`Refund ${response.id}: ${response.status}. ${response.status==='succeeded'?'Stripe confirmed success; bank posting may take additional time.':'Review the request status before taking further action.'}`);
   setOpen(false);setPreview(null);
   await queryClient.invalidateQueries({queryKey:['refund-requests']});
   await queryClient.invalidateQueries({queryKey:['ticket-orders']});
  } catch(e) {setError(`${errorText(e)} Check the refund list before retrying: an interrupted response may still have created a processing request.`);await queryClient.invalidateQueries({queryKey:['refund-requests']});}
  finally{setBusy(false);}
 }
 function exportPage() {
  if(!report)return;
  const cell=(value:unknown)=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
  const rows=[['Refund request','Order','Customer','Local status','Local amount','Currency','Local refund ID','Payment ID','Finding','Detail','Stripe refunds'],...report.rows.map(r=>[r.id,r.orderId,r.customerEmail,r.localStatus,r.localAmount,r.currency,r.localRefundId,r.paymentId,r.finding,r.detail,r.providerRefunds.map(p=>`${p.id}: ${p.status} ${p.amount} ${p.currency}`).join('; ')])];
  const url=URL.createObjectURL(new Blob([rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`refund-reconciliation-page-${report.page}.csv`;link.click();URL.revokeObjectURL(url);
 }
 const rows=report?.rows.filter(r=>!attention||r.needsAttention)||[];
 return <section className='space-y-4 rounded-xl border bg-white p-5'>
  <div className='flex flex-wrap items-start justify-between gap-4'><div><h3 className='font-semibold'>Refund review tools</h3><p className='mt-1 text-sm text-slate-600'>The reconciliation report only reads records. Issuing a refund is a separate, confirmed action.</p></div><button className={button} onClick={()=>{setOpen(true);setCancellationReason('voluntary');setOrderId('');setReason('');setPreview(null);setError('');setConfirmed(false);}}>Issue refund by order ID</button></div>
  {result?<p role='status' className='rounded-lg bg-blue-50 p-3 text-sm'>{result}</p>:null}
  <div className='flex flex-wrap items-center gap-3'><button disabled={reportBusy} className={button} onClick={()=>loadReport(1)}>{reportBusy?'Checking Stripe…':'Run read-only reconciliation'}</button>{report?<><button disabled={reportBusy} className={button} onClick={exportPage}>Export this page to CSV</button><label className='flex items-center gap-2 text-sm'><input type='checkbox' checked={attention} onChange={e=>setAttention(e.target.checked)}/>Only needs attention</label></>:null}</div>
  {reportError?<p role='alert' className='text-sm text-red-600'>{reportError}</p>:null}
  {report?<><p className='text-xs text-slate-500'>Checked {new Date(report.generatedAt).toLocaleString()} · Page {report.page} · {report.total} local requests. Stripe account/mode follows the backend key. Unlinked refunds need manual review; an email match alone is not proof.</p><div className='overflow-x-auto'><table className='w-full text-left text-sm'><thead><tr className='border-b'><th className='p-2'>Order / buyer</th><th className='p-2'>Venue Spice</th><th className='p-2'>Stripe</th><th className='p-2'>Finding</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className='border-b align-top'><td className='p-2'><p>{r.eventTitle}</p><p className='break-all text-xs'>{r.orderId}</p><p>{r.customerEmail}</p></td><td className='p-2'>{r.localStatus}<br/>{money(r.localAmount,r.currency)}<p className='break-all text-xs'>{r.localRefundId||'No reference'}</p></td><td className='p-2'>{r.providerRefunds.length?r.providerRefunds.map(p=><p key={p.id} className='mb-2 break-all'>{p.status} · {money(p.amount,p.currency)}<br/><span className='text-xs'>{p.id}</span></p>):'Not confirmed'}</td><td className='max-w-sm p-2'><strong className={r.needsAttention?'text-amber-700':'text-emerald-700'}>{r.finding.replace(/_/g,' ')}</strong><p className='mt-1 text-slate-600'>{r.detail}</p></td></tr>)}</tbody></table>{!rows.length?<p className='p-4 text-sm'>No matching rows on this page.</p>:null}</div><div className='flex gap-2'><button disabled={reportBusy||report.page===1} className={button} onClick={()=>loadReport(report.page-1)}>Previous</button><button disabled={reportBusy||report.page*report.pageSize>=report.total} className={button} onClick={()=>loadReport(report.page+1)}>Next</button></div></>:null}
  <Modal open={open} onClose={()=>{if(!busy)setOpen(false);}} title='Admin-initiated refund' description='Review the order and confirm the exact refund before submitting.' footer={preview?<button className={`${button} bg-red-600 text-white`} disabled={busy||!confirmed||reason.trim().length<5} onClick={issue}>{busy?'Processing…':`Issue ${money(preview.refundAmount,preview.currency)} refund`}</button>:undefined}>
   <div className='space-y-4'><label className='block text-sm'>Cancellation reason<select className={input} value={cancellationReason} disabled={busy} onChange={e=>{setCancellationReason(e.target.value as RefundReason);setPreview(null);setConfirmed(false);}}><option value='voluntary'>Buyer voluntary cancellation</option><option value='organizer_cancellation'>Organizer cancellation — full refund</option><option value='platform_error'>Platform error — full refund</option></select></label><label className='block text-sm'>Order ID<input className={input} value={orderId} disabled={busy} onChange={e=>{setOrderId(e.target.value);setPreview(null);setConfirmed(false);}}/></label><button disabled={busy||!orderId.trim()} className={button} onClick={loadPreview}>{busy?'Checking…':'Preview refund'}</button>
   {error?<p role='alert' className='rounded-lg bg-red-50 p-3 text-sm text-red-700'>{error}</p>:null}
   {preview?<><div className='rounded-lg bg-slate-50 p-4 text-sm'><p className='font-semibold'>{preview.eventTitle}</p><p>{preview.customerName} · {preview.customerEmail}</p><dl className='mt-3 grid grid-cols-2 gap-2'><dt>Ticket / add-on subtotal after discount</dt><dd>{money(preview.subtotal,preview.currency)}</dd><dt>Buyer-facing fees</dt><dd>{money(preview.buyerFees,preview.currency)}</dd><dt>Tax collected</dt><dd>{money(preview.tax,preview.currency)}</dd><dt>Total paid</dt><dd>{money(preview.total,preview.currency)}</dd><dt>Applied refund percentage</dt><dd>{preview.percentage}%</dd><dt>Processing fee originally charged to buyer</dt><dd>{money(preview.buyerProcessingFee,preview.currency)}</dd><dt>Processing fee retained</dt><dd>{money(preview.retainedProcessingFee,preview.currency)}</dd><dt>Tickets / add-ons refunded</dt><dd>{money(preview.refundedSubtotal,preview.currency)}</dd><dt>Buyer fees refunded</dt><dd>{money(preview.refundedFees,preview.currency)}</dd><dt>Total retained (including policy percentage)</dt><dd>{money(preview.totalRetained,preview.currency)}</dd><dt>Refund to buyer</dt><dd className='font-bold'>{money(preview.refundAmount,preview.currency)}</dd><dt>Included proportional tax portion</dt><dd>{money(preview.taxPortion,preview.currency)}</dd></dl></div><p className='text-sm text-slate-600'>{preview.cancellationReason==='voluntary' ? (preview.policyVersion==='legacy' ? 'This order retains its previous terms: no new processing-fee deduction applies.' : 'Voluntary cancellation: the buyer processing fee is nonrefundable; the event percentage applies to the remaining amount, including tax and service fees.') : 'Full refund for organizer cancellation or platform error, including all buyer fees and tax. The voluntary cancellation cutoff and percentage do not apply.'} Stripe’s actual processing cost is separate and is not returned. All tickets in this order are invalidated on success, even for a percentage refund. Tax reporting must reflect the refund.</p><label className='block text-sm'>Reason<textarea maxLength={1000} className={input} value={reason} disabled={busy} onChange={e=>setReason(e.target.value)}/></label><label className='flex items-start gap-2 text-sm'><input className='mt-1' type='checkbox' checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>I reviewed the buyer, amount and ticket cancellation, and confirm no separate reimbursement has been made.</label></>:null}</div>
  </Modal>
 </section>;
}
