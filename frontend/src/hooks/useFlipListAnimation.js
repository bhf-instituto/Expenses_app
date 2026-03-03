import { useCallback, useLayoutEffect, useRef } from 'react';

const DEFAULT_DURATION = 240;
const DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function useFlipListAnimation(
  orderedIds,
  options = {
    duration: DEFAULT_DURATION,
    easing: DEFAULT_EASING,
  }
) {
  const elementsRef = useRef(new Map());
  const previousRectsRef = useRef(new Map());
  const duration = options.duration ?? DEFAULT_DURATION;
  const easing = options.easing ?? DEFAULT_EASING;

  const setItemRef = useCallback(
    (itemId) => (node) => {
      const key = String(itemId);
      if (node) {
        elementsRef.current.set(key, node);
        return;
      }
      elementsRef.current.delete(key);
    },
    []
  );

  useLayoutEffect(() => {
    const nextRects = new Map();

    orderedIds.forEach((itemId) => {
      const key = String(itemId);
      const node = elementsRef.current.get(key);
      if (!node) return;
      nextRects.set(key, node.getBoundingClientRect());
    });

    nextRects.forEach((nextRect, key) => {
      const previousRect = previousRectsRef.current.get(key);
      if (!previousRect) return;

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      const node = elementsRef.current.get(key);
      if (!node) return;

      node.style.transition = 'transform 0ms';
      node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      node.style.willChange = 'transform';

      requestAnimationFrame(() => {
        node.style.transition = `transform ${duration}ms ${easing}`;
        node.style.transform = 'translate(0, 0)';
      });

      const cleanup = () => {
        node.style.transition = '';
        node.style.transform = '';
        node.style.willChange = '';
        node.removeEventListener('transitionend', cleanup);
      };
      node.addEventListener('transitionend', cleanup);
    });

    previousRectsRef.current = nextRects;
  }, [orderedIds, duration, easing]);

  return setItemRef;
}
