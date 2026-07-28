import PhoneInput from 'react-phone-number-input';

type PhoneNumberFieldProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
};

export function PhoneNumberField({
	value,
	onChange,
	placeholder = 'Phone number',
	error,
}: PhoneNumberFieldProps) {
	return (
		<div>
			<PhoneInput
				international
				defaultCountry='US'
				countryCallingCodeEditable={false}
				value={value}
				onChange={(nextValue) => onChange(nextValue || '')}
				placeholder={placeholder}
				className={`admin-phone-field ${error ? 'admin-phone-field--error' : ''}`}
			/>
			{error ? <p className='mt-1 text-xs font-medium text-red-600'>{error}</p> : null}
		</div>
	);
}
