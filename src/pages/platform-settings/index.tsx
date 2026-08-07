import { useEffect, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { usePlatformSettings, useUpdatePricingSettings } from '@/features/platform-settings/hooks';
import type { PricingSettings } from '@/features/platform-settings/api';

const initialForm: PricingSettings = {
	venueSpiceFeePercent: 0.032,
	venueSpiceFeeFixed: 1.29,
	paymentProcessingFeePercent: 0.029,
	paymentProcessingFeeFixed: 0.3,
	organizerPayoutHoldDays: 3,
	defaultFeePayer: 'buyer',
	stripeAutomaticTaxEnabled: true,
	stripeTaxCode: '',
	stripeTaxBehavior: 'exclusive',
};

export function PlatformSettingsPage() {
	const settingsQuery = usePlatformSettings();
	const updatePricing = useUpdatePricingSettings();
	const [form, setForm] = useState<PricingSettings>(initialForm);
	const [message, setMessage] = useState('');

	useEffect(() => {
		if (settingsQuery.data?.pricing) {
			setForm(settingsQuery.data.pricing);
		}
	}, [settingsQuery.data]);

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setMessage('');
		await updatePricing.mutateAsync(form);
		setMessage('Pricing settings saved successfully.');
	};

	return (
		<div>
			<PageHeader
				title='Platform Settings'
				description='Manage pricing values used by checkout. Updates are stored in the database and audited.'
			/>

			<form onSubmit={submit} className='mt-6 max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
				<div className='flex items-center gap-3 border-b border-slate-100 pb-5'>
					<div className='grid h-11 w-11 place-items-center rounded-full bg-primary-10 text-primary'>
						<Settings size={21} />
					</div>
					<div>
						<h2 className='text-lg font-semibold text-slate-950'>Checkout pricing</h2>
						<p className='text-sm text-slate-500'>Venue Spice fee is per paid ticket. Processing fee is an estimate per order.</p>
					</div>
				</div>

				<div className='mt-6 grid gap-5 md:grid-cols-2'>
					<NumberField
						label='Venue Spice service fee percent'
						helper='Use decimal format. 0.032 means 3.2%.'
						value={form.venueSpiceFeePercent}
						step='0.001'
						onChange={(value) => setForm((current) => ({ ...current, venueSpiceFeePercent: value }))}
					/>
					<NumberField
						label='Venue Spice fixed fee per ticket'
						helper='Example: 1.29'
						value={form.venueSpiceFeeFixed}
						step='0.01'
						onChange={(value) => setForm((current) => ({ ...current, venueSpiceFeeFixed: value }))}
					/>
					<NumberField
						label='Processing fee percent estimate'
						helper='Use decimal format. 0.029 means 2.9%.'
						value={form.paymentProcessingFeePercent}
						step='0.001'
						onChange={(value) => setForm((current) => ({ ...current, paymentProcessingFeePercent: value }))}
					/>
						<NumberField
							label='Processing fixed fee per order'
							helper='Example: 0.30'
							value={form.paymentProcessingFeeFixed}
							step='0.01'
							onChange={(value) => setForm((current) => ({ ...current, paymentProcessingFeeFixed: value }))}
						/>
						<NumberField
							label='Organizer payout hold days'
							helper='Days after event end before organizer earnings become withdrawable.'
							value={form.organizerPayoutHoldDays}
							step='1'
							onChange={(value) => setForm((current) => ({ ...current, organizerPayoutHoldDays: value }))}
						/>
						<label className='block md:col-span-2'>
						<span className='text-sm font-medium text-slate-700'>Default fee payer</span>
						<select
							value={form.defaultFeePayer}
							onChange={(event) => setForm((current) => ({ ...current, defaultFeePayer: event.target.value as PricingSettings['defaultFeePayer'] }))}
							className='mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'>
							<option value='buyer'>Buyer pays fees at checkout</option>
							<option value='organizer'>Organizer absorbs fees</option>
						</select>
					</label>
				</div>

				<div className='mt-8 border-t border-slate-100 pt-6'>
					<h2 className='text-lg font-semibold text-slate-950'>Stripe Tax</h2>
					<p className='mt-1 text-sm text-slate-500'>Controls used when creating Stripe Checkout sessions for ticket purchases.</p>
					<div className='mt-5 grid gap-5 md:grid-cols-2'>
						<label className='flex items-start gap-3 rounded-lg border border-slate-200 p-4 md:col-span-2'>
							<input
								type='checkbox'
								checked={form.stripeAutomaticTaxEnabled}
								onChange={(event) => setForm((current) => ({ ...current, stripeAutomaticTaxEnabled: event.target.checked }))}
								className='mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20'
							/>
							<span>
								<span className='block text-sm font-medium text-slate-700'>Enable Stripe Automatic Tax</span>
								<span className='mt-1 block text-xs text-slate-500'>Stripe will collect the buyer billing address in Checkout and calculate tax where your Stripe account is registered/configured.</span>
							</span>
						</label>
						<label className='block'>
							<span className='text-sm font-medium text-slate-700'>Stripe tax code</span>
							<input
								value={form.stripeTaxCode}
								onChange={(event) => setForm((current) => ({ ...current, stripeTaxCode: event.target.value }))}
								placeholder='Optional, e.g. txcd_...'
								className='mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
							/>
							<span className='mt-1 block text-xs text-slate-500'>Leave blank to let Stripe use your default product tax behavior.</span>
						</label>
						<label className='block'>
							<span className='text-sm font-medium text-slate-700'>Tax behavior</span>
							<select
								value={form.stripeTaxBehavior}
								onChange={(event) => setForm((current) => ({ ...current, stripeTaxBehavior: event.target.value as PricingSettings['stripeTaxBehavior'] }))}
								className='mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'>
								<option value='exclusive'>Exclusive: tax added on top</option>
								<option value='inclusive'>Inclusive: price already includes tax</option>
								<option value='unspecified'>Unspecified: do not send tax behavior</option>
							</select>
						</label>
					</div>
				</div>

				<div className='mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600'>
					<p>
						Current Venue Spice fee: <strong>{(form.venueSpiceFeePercent * 100).toFixed(2)}% + USD {form.venueSpiceFeeFixed.toFixed(2)}</strong> per paid ticket.
					</p>
						<p className='mt-1'>
							Processing estimate: <strong>{(form.paymentProcessingFeePercent * 100).toFixed(2)}% + USD {form.paymentProcessingFeeFixed.toFixed(2)}</strong> per order.
						</p>
						<p className='mt-1'>
							Organizer payout hold: <strong>{form.organizerPayoutHoldDays} day{form.organizerPayoutHoldDays === 1 ? '' : 's'} after event end</strong>.
						</p>
					<p className='mt-1'>
						Stripe Tax: <strong>{form.stripeAutomaticTaxEnabled ? `enabled, ${form.stripeTaxBehavior}` : 'disabled'}</strong>{form.stripeTaxCode ? ` with tax code ${form.stripeTaxCode}` : ''}.
					</p>
				</div>

				{message ? <p className='mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700'>{message}</p> : null}
				{updatePricing.error ? <p className='mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700'>{updatePricing.error.message}</p> : null}

				<button
					type='submit'
					disabled={updatePricing.isPending || settingsQuery.isLoading}
					className='mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60'>
					<Save size={17} />
					{updatePricing.isPending ? 'Saving...' : 'Save pricing settings'}
				</button>
			</form>
		</div>
	);
}

function NumberField({
	label,
	helper,
	value,
	step,
	onChange,
}: {
	label: string;
	helper: string;
	value: number;
	step: string;
	onChange: (value: number) => void;
}) {
	return (
		<label className='block'>
			<span className='text-sm font-medium text-slate-700'>{label}</span>
			<input
				type='number'
				min='0'
				step={step}
				value={value}
				onChange={(event) => onChange(Number(event.target.value))}
				className='mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10'
			/>
			<span className='mt-1 block text-xs text-slate-500'>{helper}</span>
		</label>
	);
}
