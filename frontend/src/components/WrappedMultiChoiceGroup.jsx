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
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const optionValue = String(option.value);
        const isActive = values.includes(optionValue);
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
            key={optionValue}
            type="button"
            onClick={() => onChange(toggleInList(values, optionValue))}
            style={{ minWidth: `${itemMinWidth}px` }}
            className={`${baseClasses} ${borderClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
