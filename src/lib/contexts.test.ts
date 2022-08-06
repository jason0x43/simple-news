import { describe, expect, it, vi, type Mock } from 'vitest';
import { getContext, setContext } from 'svelte';
import {
  appContextKey,
  getAppContext,
  getReaderContext,
  readerContextKey,
  setAppContext,
  setReaderContext
} from '$lib/contexts';

vi.mock('svelte');

function testGetContext(getter: () => unknown, key: unknown) {
  const mockGetContext = getContext as Mock;
  const context = { context: 'get reader' };
  mockGetContext.mockReturnValue(context);
  const result = getter();
  expect(getContext).toBeCalledWith(key);
  expect(result).toEqual(context);
}

function testSetContext<T extends Record<string, unknown>>(
  setter: (ctx: T) => T,
  key: unknown
) {
  const mockSetContext = setContext as Mock;
  mockSetContext.mockImplementation((_key: unknown, ctx: unknown) => ctx);
  const context = {} as T;
  const result = setter(context);
  expect(setContext).toBeCalledWith(key, context);
  expect(result).toEqual(context);
}

describe('getReaderContext', () => {
  it('returns the reader context', () => {
    testGetContext(getReaderContext, readerContextKey);
  });
});

describe('setReaderContext', () => {
  it('sets the reader context', () => {
    testSetContext(setReaderContext, readerContextKey);
  });
});

describe('getAppContext', () => {
  it('returns the app context', () => {
    testGetContext(getAppContext, appContextKey);
  });
});

describe('setAppContext', () => {
  it('sets the app context', () => {
    testSetContext(setAppContext, appContextKey);
  });
});
