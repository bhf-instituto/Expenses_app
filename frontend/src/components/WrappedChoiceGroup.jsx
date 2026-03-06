export default function WrappedChoiceGroup({
  options,
  value,
  onChange,
  itemMinWidth = 104,
  borderless = false,
}) {
  const resolveOptionStyle = (option) => {
    if (!option?.bgColorVar) {
      return { style: undefined, hasCustomStyle: false };
    }

    return {
      hasCustomStyle: true,
      style: {
        backgroundColor: `rgb(var(${option.bgColorVar}))`,
      },
    };
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = String(option.value) === String(value);
        const { style, hasCustomStyle } = resolveOptionStyle(option);
        const baseClasses =
          'form-filter-choice-btn rounded-lg px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wide transition';
        const borderClasses = borderless ? 'border-0' : 'border';
        const activeClasses = hasCustomStyle
          ? 'border-app-ink text-app-ink'
          : borderless
            ? 'bg-app-ink/25 text-app-ink'
            : 'border-app-ink bg-app-ink/25 text-app-ink';
        const inactiveClasses = hasCustomStyle
          ? 'border-transparent text-app-muted opacity-80 hover:bg-app-bg hover:opacity-100'
          : borderless
            ? 'bg-app-bg/55 text-app-muted hover:bg-black/45 hover:text-app-ink'
            : 'border-transparent bg-app-bg/55 text-app-muted hover:bg-black/45 hover:text-app-ink';

        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            style={{ minWidth: `${itemMinWidth}px`, ...style }}
            className={`${baseClasses} ${borderClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
