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
