import { describe, expect, it, vi, type Mock } from 'vitest';
import { getContext, setContext } from 'svelte';
import { getAppContext, setAppContext } from '$lib/contexts';
import { writable } from 'svelte/store';

vi.mock('svelte', () => ({
	getContext: vi.fn(),
	setContext: vi.fn()
}));

describe('getAppContext', () => {
	it('returns a context value', () => {
		const mockGetContext = getContext as Mock;
		const context = { context: 'get reader' };
		mockGetContext.mockReturnValue(context);
		const key = 'sidebarVisible';
		const result = getAppContext(key);
		expect(getContext).toBeCalledWith(key);
		expect(result).toEqual(context);
	});
});

describe('setAppContext', () => {
	it('sets a context value', () => {
		const mockSetContext = setContext as Mock;
		mockSetContext.mockImplementation((_key: unknown, ctx: unknown) => ctx);
		const key = 'sidebarVisible';
		const context = writable(false);
		const result = setAppContext(key, context);
		expect(setContext).toBeCalledWith(key, context);
		expect(result).toEqual(context);
	});
});
