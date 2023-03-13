import { describe, expect, it } from 'vitest';
import { diffDates, getAge } from './date';

describe('diffDates', () => {
	it('diffs two dates in ascendign order', () => {
		const date1 = new Date('2021-07-01T12:15:23.123');
		const date2 = new Date('2022-08-31T11:10:18.456');
		const result = diffDates(date1, date2);
		expect(result).toEqual({
			milliseconds: 36802495333,
			seconds: 36802495,
			minutes: 613374,
			hours: 10222,
			days: 425,
			weeks: 60,
			months: 13,
			years: 1
		});
	});

	it('diffs two dates in descending order', () => {
		const date1 = new Date('2022-08-31T11:10:18.456');
		const date2 = new Date('2021-07-01T12:15:23.123');
		const result = diffDates(date1, date2);
		expect(result).toEqual({
			milliseconds: 36802495333,
			seconds: 36802495,
			minutes: 613374,
			hours: 10222,
			days: 425,
			weeks: 60,
			months: 13,
			years: 1
		});
	});
});

describe('getAge', () => {
	it('returns the age of a date that is weeks old', () => {
		const date = new Date();
		date.setFullYear(date.getFullYear() - 1);
		const result = getAge(date);
		expect(result).toEqual('52 w');
	});

	it('returns the age of a date that is days old', () => {
		const date = new Date();
		date.setDate(date.getDate() - 4);
		// Add some hours to ensure the test doesn't break during a DST change
		date.setHours(date.getHours() - 4);
		const result = getAge(date);
		expect(result).toEqual('4 d');
	});

	it('returns the age of a date that is hours old', () => {
		const date = new Date();
		date.setHours(date.getHours() - 3);
		const result = getAge(date);
		expect(result).toEqual('3 h');
	});

	it('returns the age of a date that is minutes old', () => {
		const date = new Date();
		date.setMinutes(date.getMinutes() - 23);
		const result = getAge(date);
		expect(result).toEqual('23 m');
	});
});
