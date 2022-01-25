import { useCallback, useEffect, useRef, useState } from "./deps.ts";

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
  (
    elem:
      | HTMLElement
      | null,
  ) => void,
] {
  const observer = useRef<ResizeObserver | undefined>();
  const [width, setWidth] = useState<number | undefined>();

  const setRef = useCallback((elem: HTMLElement | null) => {
    if (observer.current) {
      observer.current.disconnect();
      observer.current = undefined;
    }

    if (elem) {
      observer.current = new ResizeObserver((entries) => {
        setWidth(entries[0].contentRect.width);
      });

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

  return [width, setRef];
}
