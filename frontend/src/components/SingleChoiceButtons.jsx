export default function SingleChoiceButtons({
  value,
  onChange,
  options,
  columns = 3,
  compact = false,
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const isActive = String(value) === String(option.value);
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-2 py-2 font-heading font-semibold uppercase tracking-wide transition ${
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
  );
}
