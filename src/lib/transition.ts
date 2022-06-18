import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export function slide(
  node: Element,
  options: {
    delay?: number;
    duration?: number;
    easing?: (t: number) => number;
    direction?: 'left' | 'right' | 'up' | 'down';
  } = {}
): TransitionConfig {
  const {
    delay = 0,
    duration = 400,
    easing = cubicOut,
    direction = 'left'
  } = options;
  const style = getComputedStyle(node);
  const sizeDim =
    direction === 'left' || direction === 'right' ? 'width' : 'height';
  const sizeDimVal = parseFloat(style[sizeDim]);
  const moveDim =
    direction === 'left' || direction === 'right' ? 'left' : 'top';
  const update =
    direction === 'left' || direction === 'up'
      ? (t: number) => sizeDimVal - t * sizeDimVal
      : (t: number) => -sizeDimVal + t * sizeDimVal;

  return {
    delay,
    duration,
    easing,
    css: (t: number) => `position:absolute;${moveDim}:${update(t)}px`
  };
}
