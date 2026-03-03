import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function HorizontalScrollableChoice({
  options,
  value,
  onChange,
  itemMinWidth = 104,
  borderless = false,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const hasOverflow = useMemo(() => canScrollLeft || canScrollRight, [canScrollLeft, canScrollRight]);

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
  }, [options, updateScrollState]);

  return (
    <div className="flex items-center gap-2">
      <div ref={scrollRef} className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
        <div className="flex min-w-max gap-2 pr-1">
          {options.map((option) => {
            const isActive = String(option.value) === String(value);
            const baseClasses =
              'rounded-lg px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wide transition';
            const borderClasses = borderless ? 'border-0' : 'border';
            const activeClasses = borderless
              ? 'bg-app-mint text-app-ink'
              : 'border-app-ink/60 bg-app-mint text-app-ink';
            const inactiveClasses = borderless
              ? 'bg-app-mint/100 text-app-ink hover:bg-app-bg'
              : 'border-app-ink/20 bg-app-panel text-app-muted hover:bg-app-bg';
            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => onChange(option.value)}
                style={{ minWidth: `${itemMinWidth}px` }}
                className={`${baseClasses} ${borderClasses} ${isActive ? activeClasses : inactiveClasses}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {!hasOverflow ? (
        <span className="sr-only">Sin desplazamiento horizontal</span>
      ) : null}
    </div>
  );
}
