import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { useEvents, useOrganizations } from '@/features/ticketing/hooks';
import { analyticsApi, type ReportName } from '@/features/analytics/api';

const reports: { id: ReportName; label: string }[] = [
  { id: 'website-traffic', label: 'Website Traffic' }, { id: 'user-engagement', label: 'User Engagement' },
  { id: 'checkout-conversion', label: 'Checkout Conversion' }, { id: 'registrations', label: 'User Registration' }, { id: 'event-creation', label: 'Event Creation' },
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
  const format = (value: unknown, key?: string) => {
    if (value === null || value === undefined) return '—';
    const unit = data?.columns.find(c => c.key === key)?.unit;
    const decimals = report === 'revenue' || unit ? 2 : 0;
    const number = new Intl.NumberFormat('en', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(Number(value));
    return `${number}${unit === 'percent' ? '%' : unit === 'seconds' ? ' s' : ''}`;
  };
  const coverage = data?.coverage;
  const trackingStart = coverage?.firstObservedAt ? new Date(coverage.firstObservedAt).toISOString().slice(0, 10) : null;
  const comparisonIncomplete = coverage && data && (data.previousStart < coverage.retentionCutoff.slice(0, 10) || !trackingStart || data.previousStart < trackingStart);
  const funnelRows = data?.report === 'checkout-conversion' ? data.columns.filter(c => ['journeys', 'selected', 'started', 'completed'].includes(c.key)).map(c => ({ name: c.label, value: Number(total?.[c.key] || 0) })) : [];

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
    <PageHeader title='Analytics Reports' description='Track traffic, engagement, checkout conversion, platform growth, sales, revenue, and tax collected.' />
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
      {coverage && <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950' role='status'>
        {trackingStart ? <>Retained tracking for this scope begins {trackingStart}. Latest recorded activity: {coverage.lastObservedAt ? new Date(coverage.lastObservedAt).toLocaleString('en', { timeZone: 'UTC' }) : 'unavailable'} UTC. </> : <>No tracking has been recorded for this scope. Enable collection on the backend and public frontend before expecting results. </>}
        Raw tracking is retained for {coverage.retentionDays} days. Earlier, blocked, or untracked activity is unavailable; zeros do not establish that no visitors arrived.
        {compare && comparisonIncomplete && <p className='mt-2 font-medium'>The comparison period may have incomplete tracking history.</p>}
      </div>}

      {report === 'revenue' && <label className='flex items-center gap-3 text-sm'>Currency<select className={control} value={selectedCurrency} onChange={e => setCurrency(e.target.value)}>{currencies.map(c => <option key={c}>{c}</option>)}</select><span>Currencies are never combined.</span></label>}
      {compare && <p className='text-sm text-slate-600'>Compared with {data.previousStart} through {data.previousEnd} (UTC).</p>}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>{data.columns.map(c => {
        const value = total?.[c.key] ?? (c.nullable ? null : 0); const before = previous?.[c.key] ?? (c.nullable ? null : 0);
        const delta = value === null || before === null ? 'Comparison unavailable' : c.unit === 'percent'
          ? `${(Number(value) - Number(before)).toFixed(2)} percentage points`
          : Number(before) === 0 ? (Number(value) === 0 ? 'No change' : 'No prior baseline') : `${((Number(value) - Number(before)) / Math.abs(Number(before)) * 100).toFixed(1)}%`;
        return <div key={c.key} className='rounded-xl border bg-white p-5'><p className='text-sm text-slate-600'>{c.label}</p><p className='mt-2 text-2xl font-semibold'>{selectedCurrency} {format(value, c.key)}</p>{compare && <p className='mt-2 text-sm text-slate-500'>Previous: {format(before, c.key)} · {delta}</p>}</div>;
      })}</div>
      {funnelRows.length > 0 && <div className='rounded-xl border bg-white p-4'>
        <h3 className='font-semibold'>Observed checkout stages</h3>
        <p className='mt-1 text-sm text-slate-600'>One count per visitor/session/event. Missing browser signals can cause gaps between stages. Completion is confirmed by the backend.</p>
        <div className='mt-4 h-64' role='img' aria-label='Checkout stages; exact counts are in the summary cards above.'><ResponsiveContainer width='100%' height='100%'><BarChart data={funnelRows} layout='vertical' margin={{ left: 20 }}><CartesianGrid strokeDasharray='3 3' /><XAxis type='number' allowDecimals={false} /><YAxis type='category' dataKey='name' width={175} /><Tooltip /><Bar dataKey='value' name='Journeys' fill='#ea580c' /></BarChart></ResponsiveContainer></div>
      </div>}
      {rows.length > 0 ? <div className='rounded-xl border bg-white p-4'>
        <label className='flex items-center gap-3 text-sm'>Chart metric<select className={control} value={selectedMetric} onChange={e => setMetric(e.target.value)}>{data.columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></label>
        <div className='mt-4 h-72' role='img' aria-label={`${reports.find(r => r.id === report)?.label} by ${groupBy}. Values are listed in the table below.`}><ResponsiveContainer width='100%' height='100%'><BarChart data={rows}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='bucket' /><YAxis /><Tooltip formatter={value => format(value, selectedMetric)} /><Bar dataKey={selectedMetric} name={data.columns.find(c => c.key === selectedMetric)?.label} fill='#ea580c' /></BarChart></ResponsiveContainer></div>
      </div> : <p>No records for this period and currency.</p>}
      <div className='overflow-x-auto rounded-xl border bg-white'><table className='w-full text-left text-sm'><caption className='p-3 text-left text-slate-600'>Current period · UTC · partial weeks/months include only selected dates.</caption><thead><tr><th className='p-3'>Period starting</th>{data.columns.map(c => <th key={c.key} className='p-3'>{c.label}{selectedCurrency ? ` (${selectedCurrency})` : ''}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={`${r.bucket}:${r.currency}`} className='border-t'><td className='p-3'>{r.bucket}</td>{data.columns.map(c => <td key={c.key} className='p-3'>{format(r[c.key], c.key)}</td>)}</tr>)}</tbody></table></div>
    </>}
    {data && <p className='text-sm text-slate-500'>Report generated {new Date(data.generatedAt).toLocaleString('en', { timeZone: 'UTC' })} UTC. Tax collected is shown in Revenue and is excluded from platform earnings.</p>}
  </section>;
}
