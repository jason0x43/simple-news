import { getContext, setContext } from 'svelte';

type ReaderContext = {
  onTitlePress(listener: () => void): () => void;
};

const readerContext = Symbol('reader');

export function getReaderContext() {
  return getContext<ReaderContext>(readerContext);
}

export function setReaderContext(value: ReaderContext) {
  return setContext<ReaderContext>(readerContext, value);
}

type AppContext = {
  getRoot(): HTMLElement;
};

const appContext = Symbol('app');

export function getAppContext() {
  return getContext<AppContext>(appContext);
}

export function setAppContext(value: AppContext) {
  return setContext<AppContext>(appContext, value);
}
