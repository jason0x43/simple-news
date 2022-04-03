import { useCallback, useEffect, useRef, useState } from "react";
import { getCookie, loadValue, setCookie, storeValue } from "./util.ts";

export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const matcher = globalThis.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    setMatches(matcher.matches);
    matcher.addEventListener("change", listener);

    return () => {
      matcher.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}

export function useOrientiation(): "landscape" | "portrait" {
  const isLandscape = useMediaQuery("(orientation: landscape)");
  return isLandscape ? "landscape" : "portrait";
}

export function useWidthObserver(): [
  number | undefined,
  (elem: HTMLElement | null) => void,
  React.RefObject<HTMLElement>,
] {
  const observer = useRef<ResizeObserver | undefined>();
  const [width, setWidth] = useState<number | undefined>();
  const ref = useRef<HTMLElement | null>(null);

  const setRef = useCallback((elem: HTMLElement | null) => {
    ref.current = elem;

    if (!observer.current) {
      observer.current = new ResizeObserver((entries) => {
        // Update the width in a timeout to avoid an observer loop
        setTimeout(() => setWidth(entries[0].contentRect.width));
      });
    } else {
      observer.current.disconnect();
    }

    if (elem) {
      observer.current.observe(elem);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = undefined;
      }
    };
  }, []);

  return [width, setRef, ref];
}

export function useAppVisibility() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const listener = () => {
      setVisible(document.visibilityState !== "hidden");
    };

    document.addEventListener("visibilitychange", listener);

    return () => {
      document.removeEventListener("visibilitychange", listener);
    };
  }, []);

  return visible;
}

/**
 * Every update to the state value also updates a cookie
 */
export function useCookieState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState(() => getCookie<T>(key) ?? initialValue);

  const setter = (newValue: T | ((oldVal: T) => T)) => {
    const valueToStore = newValue instanceof Function
      ? newValue(value)
      : newValue;
    setValue(valueToStore);
    setCookie(key, valueToStore);
  };

  return [value, setter] as const;
}

/**
 * Every update to the state value also updates localStorage
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState(initialValue);

  // If we're loading a value from local storage, we need to do it in effect so
  // the client won't initially disagree with whatever the server rendered
  useEffect(() => {
    const value = loadValue<T>(key);
    if (value !== undefined) {
      setValue(value);
    }
  }, []);

  const setter = (newValue: T | ((oldVal: T) => T)) => {
    const valueToStore = newValue instanceof Function
      ? newValue(value)
      : newValue;
    setValue(valueToStore);
    storeValue(key, valueToStore);
  };

  return [value, setter] as const;
}

/**
 * An effect that doesn't start paying attention to its dependencies until
 * they've been initialized.
 */
export const useChangeEffect: typeof useEffect = (effect, deps) => {
  // The effect should start ready if there are no dependencies
  const ready = useRef(deps === undefined || deps.length === 0);
  const lastDeps = useRef<unknown[]>();

  useEffect(() => {
    if (!ready.current) {
      ready.current = deps?.every((val) => val !== undefined) ?? false;
      lastDeps.current = deps?.slice();
    } else {
      // Only run the effect if the dependecy values have actually changed.
      // Sometimes (dev mode + React.Strict?) the effect is called even when
      // values haven't changed.
      if (!deps || !deps.every((dep, i) => lastDeps.current?.[i] === dep)) {
        const cleanup = effect();
        return () => cleanup?.();
      }
    }
  }, deps);
};
