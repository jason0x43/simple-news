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
