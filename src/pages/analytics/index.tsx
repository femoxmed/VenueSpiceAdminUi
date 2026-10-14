import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { useEvents, useOrganizations } from '@/features/ticketing/hooks';
import { analyticsApi, type ReportName } from '@/features/analytics/api';

const reports: { id: ReportName; label: string }[] = [
  { id: 'registrations', label: 'User Registration' }, { id: 'event-creation', label: 'Event Creation' },
  { id: 'organizer-adoption', label: 'Organizer Adoption' }, { id: 'ticket-sales', label: 'Ticket Sales' }, { id: 'revenue', label: 'Revenue' },
];
const date = (d: Date) => d.toISOString().slice(0, 10);
const control = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
export function AnalyticsPage({ initialReport = 'registrations' }: { initialReport?: ReportName }) {
  const [report, setReport] = useState<ReportName>(initialReport);
  const [start, setStart] = useState(() => date(new Date(Date.now() - 29 * 86400000)));
  const [end, setEnd] = useState(() => date(new Date()));
  const [groupBy, setGroupBy] = useState('day');
  const [organizationId, setOrganizationId] = useState('');
  const [eventId, setEventId] = useState('');
  const [compare, setCompare] = useState(true);
  const [currency, setCurrency] = useState('');
  const [metric, setMetric] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { data: organizations = [], isError: orgError } = useOrganizations();
  const { data: events = [], isError: eventError } = useEvents();
  const scoped = report !== 'registrations';
  const filters = { start, end, groupBy, organizationId: scoped ? organizationId : undefined, eventId: scoped ? eventId : undefined };
  const valid = Boolean(start && end && start <= end && (Date.parse(end) - Date.parse(start)) / 86400000 < 366);
  const query = useQuery({ queryKey: ['analytics-report', report, filters], queryFn: () => analyticsApi.report(report, filters), enabled: valid });
  const data = query.data;
  const currencies = [...new Set([...(data?.totals || []), ...(data?.previousTotals || [])].map(r => r.currency))];
  const selectedCurrency = currencies.includes(currency) ? currency : currencies[0] || '';
  const selectedMetric = data?.columns.some(c => c.key === metric) ? metric : data?.columns[0]?.key || '';
  const rows = data?.rows.filter(r => r.currency === selectedCurrency) || [];
  const previous = data?.previousTotals.find(r => r.currency === selectedCurrency);
  const total = data?.totals.find(r => r.currency === selectedCurrency);
  const format = (value: unknown) => new Intl.NumberFormat('en', { maximumFractionDigits: report === 'revenue' ? 2 : 0, minimumFractionDigits: report === 'revenue' ? 2 : 0 }).format(Number(value || 0));
  async function download() {
    setExporting(true); setExportError('');
    try {
      const blob = await analyticsApi.export(report, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${report}-${start}-${end}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setExportError(error instanceof Error ? error.message : 'Export failed'); }
    finally { setExporting(false); }
  }
  return <section className='space-y-6'>
    <PageHeader title='Analytics Reports' description='Track account growth, event creation, organizer adoption, ticket sales, and revenue.' />
    <div className='flex flex-wrap gap-2' aria-label='Select report'>{reports.map(r => <button key={r.id} aria-pressed={report === r.id} className={`${control} ${report === r.id ? '!bg-slate-900 !text-white' : ''}`} onClick={() => { setReport(r.id); setMetric(''); }}>{r.label}</button>)}</div>
    <div className='flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4'>
      <label className='grid gap-1 text-sm'>From (UTC)<input className={control} type='date' value={start} onChange={e => setStart(e.target.value)} /></label>
      <label className='grid gap-1 text-sm'>Through (UTC)<input className={control} type='date' value={end} onChange={e => setEnd(e.target.value)} /></label>
      <label className='grid gap-1 text-sm'>Group by<select className={control} value={groupBy} onChange={e => setGroupBy(e.target.value)}><option value='day'>Day</option><option value='week'>Week (Monday)</option><option value='month'>Month</option></select></label>
      <label className='grid gap-1 text-sm'>Organizer<select className={control} disabled={!scoped} value={scoped ? organizationId : ''} onChange={e => { setOrganizationId(e.target.value); setEventId(''); }}><option value=''>All organizers</option>{organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
      <label className='grid gap-1 text-sm'>Event<select className={control} disabled={!scoped} value={scoped ? eventId : ''} onChange={e => setEventId(e.target.value)}><option value=''>All events</option>{events.filter(e => !organizationId || e.organization?.id === organizationId).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
      <label className='flex items-center gap-2 py-2 text-sm'><input type='checkbox' checked={compare} onChange={e => setCompare(e.target.checked)} />Compare previous period</label>
      <button className={control} disabled={!data || !valid || query.isFetching || exporting} onClick={download}>{exporting ? 'Exporting…' : 'Export CSV (both periods)'}</button>
    </div>
    {!scoped && <p className='text-sm text-slate-600'>Registration counts are platform-wide. Event and organizer attribution is unavailable.</p>}
    {(orgError || eventError) && <p role='alert'>Some filter options could not be loaded. Refresh to try again.</p>}
    {!valid && <p role='alert' className='text-red-700'>Choose a valid date range of 1–366 days.</p>}
    {exportError && <p role='alert' className='text-red-700'>{exportError}</p>}
    {valid && query.isPending && <p role='status'>Loading report…</p>}
    {query.isError && <div role='alert' className='text-red-700'>Unable to load report: {query.error.message} <button className={control} onClick={() => query.refetch()}>Retry</button></div>}
    {valid && data && <>
      <p className='text-sm text-slate-600'>{data.definition}</p>
      {report === 'revenue' && <label className='flex items-center gap-3 text-sm'>Currency<select className={control} value={selectedCurrency} onChange={e => setCurrency(e.target.value)}>{currencies.map(c => <option key={c}>{c}</option>)}</select><span>Currencies are never combined.</span></label>}
      {compare && <p className='text-sm text-slate-600'>Compared with {data.previousStart} through {data.previousEnd} (UTC).</p>}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>{data.columns.map(c => {
        const value = Number(total?.[c.key] || 0); const before = Number(previous?.[c.key] || 0);
        return <div key={c.key} className='rounded-xl border bg-white p-5'><p className='text-sm text-slate-600'>{c.label}</p><p className='mt-2 text-2xl font-semibold'>{selectedCurrency} {format(value)}</p>{compare && <p className='mt-2 text-sm text-slate-500'>Previous: {format(before)} · {before === 0 ? (value === 0 ? 'No change' : 'No prior baseline') : `${((value - before) / Math.abs(before) * 100).toFixed(1)}%`}</p>}</div>;
      })}</div>
      {rows.length > 0 ? <div className='rounded-xl border bg-white p-4'>
        <label className='flex items-center gap-3 text-sm'>Chart metric<select className={control} value={selectedMetric} onChange={e => setMetric(e.target.value)}>{data.columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label>
        <div className='mt-4 h-72' role='img' aria-label={`${reports.find(r => r.id === report)?.label} by ${groupBy}. Values are listed in the table below.`}><ResponsiveContainer width='100%' height='100%'><BarChart data={rows}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='bucket' /><YAxis /><Tooltip /><Bar dataKey={selectedMetric} name={data.columns.find(c => c.key === selectedMetric)?.label} fill='#ea580c' /></BarChart></ResponsiveContainer></div>
      </div> : <p>No records for this period and currency.</p>}
      <div className='overflow-x-auto rounded-xl border bg-white'><table className='w-full text-left text-sm'><caption className='p-3 text-left text-slate-600'>Current period · UTC · partial weeks/months include only selected dates.</caption><thead><tr><th className='p-3'>Period starting</th>{data.columns.map(c => <th key={c.key} className='p-3'>{c.label}{selectedCurrency ? ` (${selectedCurrency})` : ''}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={`${r.bucket}:${r.currency}`} className='border-t'><td className='p-3'>{r.bucket}</td>{data.columns.map(c => <td key={c.key} className='p-3'>{format(r[c.key])}</td>)}</tr>)}</tbody></table></div>
    </>}
    <p className='text-sm text-slate-500'>Traffic, engagement, and checkout-funnel reports are next. Their tracking starts only after collection is enabled; earlier activity is unavailable.</p>
  </section>;
}
