export function zonedDateTimeToUtcDate(date: string, time: string, timeZone: string) {
	const validTimeZone = getValidTimeZone(timeZone);
	const [year, month, day] = date.split('-').map(Number);
	const [hour, minute] = (time || '00:00').split(':').map(Number);
	const wallTimeUtc = Date.UTC(year, month - 1, day, hour || 0, minute || 0, 0);
	const firstGuess = new Date(wallTimeUtc);
	const firstOffset = getTimeZoneOffsetMinutes(validTimeZone, firstGuess);
	const correctedGuess = new Date(wallTimeUtc - firstOffset * 60_000);
	const correctedOffset = getTimeZoneOffsetMinutes(validTimeZone, correctedGuess);

	return new Date(wallTimeUtc - correctedOffset * 60_000);
}

export function dateTimeLocalToIso(value: string, timeZone?: string | null) {
	if (!value) return '';
	const [date, time = '00:00'] = value.split('T');
	if (!date) return '';
	const validTimeZone = getValidTimeZone(timeZone);
	const parsed = zonedDateTimeToUtcDate(date, time, validTimeZone);
	return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function formatDateTimeLocal(value?: string | null, timeZone?: string | null) {
	if (!value) return '';
	const validTimeZone = getValidTimeZone(timeZone);
	const date = formatDateInTimeZone(value, validTimeZone);
	const time = formatTimeInTimeZone(value, validTimeZone);
	return date && time ? `${date}T${time}` : '';
}

export function formatDateInTimeZone(value: string, timeZone: string) {
	const parts = getTimeZoneParts(value, timeZone);
	return parts ? `${parts.year}-${parts.month}-${parts.day}` : '';
}

export function formatTimeInTimeZone(value: string, timeZone: string) {
	const parts = getTimeZoneParts(value, timeZone);
	return parts ? `${parts.hour}:${parts.minute}` : '';
}

export function getValidTimeZone(timeZone?: string | null) {
	if (!timeZone || typeof timeZone !== 'string') return 'America/New_York';
	try {
		new Intl.DateTimeFormat('en-US', { timeZone }).format();
		return timeZone;
	} catch {
		return 'America/New_York';
	}
}

function getTimeZoneOffsetMinutes(timeZone: string, date: Date) {
	const parts = getDateTimeParts(date, timeZone);
	const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
	return Math.round((asUtc - date.getTime()) / 60_000);
}

function getTimeZoneParts(value: string, timeZone: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	const parts = getDateTimeParts(date, timeZone);
	return {
		year: String(parts.year).padStart(4, '0'),
		month: String(parts.month).padStart(2, '0'),
		day: String(parts.day).padStart(2, '0'),
		hour: String(parts.hour).padStart(2, '0'),
		minute: String(parts.minute).padStart(2, '0'),
	};
}

function getDateTimeParts(date: Date, timeZone: string) {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
	const mapped = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
	const hour = Number(mapped.hour) === 24 ? 0 : Number(mapped.hour);

	return {
		year: Number(mapped.year),
		month: Number(mapped.month),
		day: Number(mapped.day),
		hour,
		minute: Number(mapped.minute),
		second: Number(mapped.second),
	};
}
