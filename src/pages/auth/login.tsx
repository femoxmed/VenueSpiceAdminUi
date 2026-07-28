import { useState } from 'react';
import * as yup from 'yup';
import { useLogin, useVerifyAdminOtp } from '@/features/auth/hooks';
import { authStore } from '@/lib/auth-store';
import { clearGuestCartItems, getGuestCartItems } from '@/lib/guest-cart';

const loginSchema = yup.object({
	email: yup
		.string()
		.trim()
		.email('Enter a valid email address')
		.required('Email is required'),
	password: yup
		.string()
		.min(6, 'Password must be at least 6 characters')
		.required('Password is required'),
});

const otpSchema = yup.object({
	code: yup
		.string()
		.trim()
		.matches(/^\d{6}$/, 'Enter the 6-digit code')
		.required('One-time code is required'),
});

export function LoginPage() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [otpEmail, setOtpEmail] = useState('');
	const [code, setCode] = useState('');
	const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
	const loginMutation = useLogin();
	const otpMutation = useVerifyAdminOtp();
	const isOtpStep = Boolean(otpEmail);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setValidationErrors({});

		if (isOtpStep) {
			const validOtp = await validateForm(otpSchema, { code });
			if (!validOtp.valid) {
				setValidationErrors(validOtp.errors);
				return;
			}

			const result = await otpMutation.mutateAsync({
				email: otpEmail,
				code: code.trim(),
			});
			authStore.setSession(result.accessToken, result.user, result.refreshToken);
			clearGuestCartItems();
			window.location.href = '/';
			return;
		}

		const validLogin = await validateForm(loginSchema, { email, password });
		if (!validLogin.valid) {
			setValidationErrors(validLogin.errors);
			return;
		}

		const guestCartItems = getGuestCartItems();
		const result = await loginMutation.mutateAsync({
			email: email.trim(),
			password,
			guestCartItems,
		});
		if ('requiresOtp' in result) {
			setOtpEmail(result.email);
			return;
		}
		authStore.setSession(result.accessToken, result.user, result.refreshToken);
		clearGuestCartItems();
		window.location.href = '/';
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#2960EC22,transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] p-6'>
			<div className='w-full max-w-md rounded-[28px] border border-white/60 bg-white/90 p-8 shadow-soft backdrop-blur'>
				<div className='mb-8'>
					<div className='mb-5 rounded-2xl bg-slate-950 px-6 py-5'>
						<img
							src='/src/assets/event_box_logo.png'
							alt='EventBox'
							className='mx-auto h-11 w-auto object-contain'
						/>
					</div>
					<h1 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900'>
						{isOtpStep ? 'Enter your admin code' : 'Sign in to the admin console'}
					</h1>
					<p className='mt-2 text-sm text-slate-500'>
						{isOtpStep
							? `We sent a one-time code to ${otpEmail}.`
							: 'Manage vendors, events, ticket sales, referrals, refunds, and platform security.'}
					</p>
				</div>

				<form className='space-y-4' onSubmit={handleSubmit}>
					{isOtpStep ? (
						<div>
							<label className='mb-2 block text-sm font-medium text-slate-700'>
								One-time code
							</label>
							<input
								inputMode='numeric'
								className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-xl font-semibold tracking-[0.3em] outline-none transition focus:border-secondary'
								value={code}
								onChange={(event) => {
									setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
									setValidationErrors((current) => ({ ...current, code: '' }));
								}}
								maxLength={6}
							/>
							{validationErrors.code ? (
								<p className='mt-2 text-sm text-rose-600'>{validationErrors.code}</p>
							) : null}
						</div>
					) : (
						<>
							<div>
								<label className='mb-2 block text-sm font-medium text-slate-700'>
									Email
								</label>
								<input
									className='w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-secondary'
									value={email}
									onChange={(event) => {
										setEmail(event.target.value);
										setValidationErrors((current) => ({ ...current, email: '' }));
									}}
								/>
								{validationErrors.email ? (
									<p className='mt-2 text-sm text-rose-600'>{validationErrors.email}</p>
								) : null}
							</div>
							<div>
								<label className='mb-2 block text-sm font-medium text-slate-700'>
									Password
								</label>
								<input
									type='password'
									className='w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-secondary'
									value={password}
									onChange={(event) => {
										setPassword(event.target.value);
										setValidationErrors((current) => ({ ...current, password: '' }));
									}}
								/>
								{validationErrors.password ? (
									<p className='mt-2 text-sm text-rose-600'>{validationErrors.password}</p>
								) : null}
							</div>
						</>
					)}

					{loginMutation.error || otpMutation.error ? (
						<p className='rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700'>
							{loginMutation.error?.message || otpMutation.error?.message}
						</p>
					) : null}

					<button
						type='submit'
						disabled={loginMutation.isPending || otpMutation.isPending}
						className='w-full rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60'>
						{loginMutation.isPending || otpMutation.isPending
							? 'Verifying...'
							: isOtpStep
								? 'Verify code'
								: 'Sign in'}
					</button>
				</form>
			</div>
		</div>
	);
}

async function validateForm<T extends yup.AnyObject>(
	schema: yup.ObjectSchema<T>,
	values: T,
) {
	try {
		await schema.validate(values, { abortEarly: false });
		return { valid: true, errors: {} };
	} catch (error) {
		if (!(error instanceof yup.ValidationError)) {
			throw error;
		}

		return {
			valid: false,
			errors: error.inner.reduce<Record<string, string>>((errors, issue) => {
				if (issue.path && !errors[issue.path]) {
					errors[issue.path] = issue.message;
				}
				return errors;
			}, {}),
		};
	}
}
