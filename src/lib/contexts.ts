import { getContext, setContext } from 'svelte';
import type { AppStores } from './stores';

type ReaderContext = {
  onTitlePress(listener: () => void): () => void;
};

export const readerContextKey = Symbol('reader');

export function getReaderContext() {
  return getContext<ReaderContext>(readerContextKey);
}

export function setReaderContext(value: ReaderContext) {
  return setContext<ReaderContext>(readerContextKey, value);
}

type AppContext = {
  getRoot(): HTMLElement;
  stores: AppStores;
};

export const appContextKey = Symbol('app');

export function getAppContext() {
  return getContext<AppContext>(appContextKey);
}

export function setAppContext(value: AppContext) {
  return setContext<AppContext>(appContextKey, value);
}
