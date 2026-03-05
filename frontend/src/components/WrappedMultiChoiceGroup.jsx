function toggleInList(list, value) {
  const asString = String(value);
  return list.includes(asString) ? list.filter((item) => item !== asString) : [...list, asString];
}

export default function WrappedMultiChoiceGroup({
  options,
  values,
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
        const optionValue = String(option.value);
        const isActive = values.includes(optionValue);
        const { style, hasCustomStyle } = resolveOptionStyle(option);
        const baseClasses =
          'rounded-lg px-3 py-2 text-xs font-heading font-semibold uppercase tracking-wide transition';
        const borderClasses = borderless ? 'border-0' : 'border';
        const activeClasses = hasCustomStyle
          ? 'border-app-ink/60 text-app-ink'
          : borderless
            ? 'bg-app-ink/25 text-app-ink'
            : 'bg-app-ink/25 text-app-ink';
        const inactiveClasses = hasCustomStyle
          ? 'border-app-ink/20 text-app-muted opacity-80 hover:bg-app-bg hover:opacity-100'
          : borderless
            ? 'bg-app-bg/55 text-app-muted hover:bg-black/45 hover:text-app-ink'
            : 'bg-app-bg/55 text-app-muted hover:bg-black/45 hover:text-app-ink';

        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(toggleInList(values, optionValue))}
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
