import { useCallback, useEffect, useRef, useState } from 'react';

export default function HorizontalScrollableChoice({
  options,
  value,
  onChange,
  itemMinWidth = 104,
  compact = false,
}) {
  const scrollRef = useRef(null);
  const optionRefs = useRef(new Map());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setCanScrollLeft(node.scrollLeft > 0);
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const node = scrollRef.current;
    if (!node) return undefined;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    node.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    return () => {
      node.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [options, value, updateScrollState]);

  useEffect(() => {
    const node = scrollRef.current;
    const selectedNode = optionRefs.current.get(String(value));
    if (!node || !selectedNode) return;

    const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
    const centeredLeft =
      selectedNode.offsetLeft - (node.clientWidth - selectedNode.offsetWidth) / 2;
    const nextLeft = Math.min(Math.max(0, centeredLeft), maxScrollLeft);

    node.scrollTo({ left: nextLeft, behavior: 'smooth' });
  }, [options, value]);

  return (
    <div className="w-full">
      <div className="relative">
        <div ref={scrollRef} className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max gap-2 pr-1">
            {options.map((option) => {
              const isActive = String(option.value) === String(value);
              return (
                <button
                  key={String(option.value)}
                  ref={(node) => {
                    const key = String(option.value);
                    if (node) {
                      optionRefs.current.set(key, node);
                      return;
                    }
                    optionRefs.current.delete(key);
                  }}
                  type="button"
                  onClick={() => onChange(option.value)}
                  style={{ minWidth: `${itemMinWidth}px` }}
                  className={`rounded-lg border px-3 py-2 font-heading font-semibold uppercase tracking-wide transition ${
                    compact ? 'text-[11px]' : 'text-xs'
                  } ${
                    isActive
                      ? 'border-app-ink/60 bg-app-mint text-app-ink'
                      : 'border-app-ink/20 bg-white text-app-muted hover:bg-app-bg'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {canScrollLeft ? (
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 w-6"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.98), rgba(255,255,255,0))',
            }}
          />
        ) : null}

        {canScrollRight ? (
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0 w-6"
            style={{
              background: 'linear-gradient(to left, rgba(255,255,255,0.98), rgba(255,255,255,0))',
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
