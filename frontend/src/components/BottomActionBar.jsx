export default function BottomActionBar({ label, onClick, disabled = false }) {
  return (
    <div className="safe-bottom border-t border-app-ink/10 bg-app-panel/90 px-4 pt-3 backdrop-blur">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-3 font-heading text-sm font-semibold uppercase tracking-wide transition ${
          disabled
            ? 'cursor-not-allowed border-app-ink/20 bg-app-ink/10 text-app-muted'
            : 'border-app-ink/0 bg-app-sky/30 text-app-ink hover:bg-app-mint'
        }`}
      >
        {label}
      </button>
    </div>
  );
}
