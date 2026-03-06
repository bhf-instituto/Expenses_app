export default function SingleChoiceButtons({
  value,
  onChange,
  options,
  columns = 3,
  compact = false,
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
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const isActive = String(value) === String(option.value);
        const { style, hasCustomStyle } = resolveOptionStyle(option);
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            style={style}
            className={`form-filter-choice-btn rounded-lg border px-2 py-2 font-heading font-semibold uppercase tracking-wide transition ${
              compact ? 'text-[11px]' : 'text-xs'
            } ${
              hasCustomStyle
                ? isActive
                  ? 'border-app-ink text-app-ink'
                  : 'border-transparent text-app-ink opacity-80 hover:opacity-100'
                : isActive
                  ? 'border-app-ink bg-app-mint text-app-ink'
                  : 'border-transparent bg-app-mint text-app-muted hover:bg-app-bg'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
