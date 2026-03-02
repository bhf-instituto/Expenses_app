export default function ModeToggle({ mode, onChange, viewDisabled }) {
  return (
    <div className="grid grid-cols-2 rounded-xl border-0 border-app-ink/20 bg-app-panel p-1">
      <button
        type="button"
        onClick={() => onChange('create')}
        className={`rounded-lg py-2 font-heading text-sm font-semibold uppercase tracking-wide transition ${
          mode === 'create'
            ? 'bg-app-mint text-app-ink'
            : 'text-app-muted hover:bg-app-bg'
        }`}
      >
        Crear
      </button>
      <button
        type="button"
        disabled={viewDisabled}
        onClick={() => onChange('view')}
        className={`rounded-lg py-2 font-heading text-sm font-semibold uppercase tracking-wide transition ${
          viewDisabled
            ? 'cursor-not-allowed text-app-muted/50'
            : mode === 'view'
            ? 'bg-app-mint text-app-ink'
            : 'text-app-muted hover:bg-app-bg'
        }`}
      >
        Ver
      </button>
    </div>
  );
}
