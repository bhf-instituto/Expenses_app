export default function BottomActionBar({
  label,
  onClick,
  disabled = false,
  borderless = false,
  tone = 'default',
}) {
  const enabledToneClass =
    tone === 'logout'
      ? 'bg-app-mint/100 text-app-ink hover:bg-app-bg'
      : tone === 'success'
      ? 'bg-lime-400/30 text-white hover:bg-emerald-500'
      : 'bg-app-sky/30 text-app-ink hover:bg-app-mint';

  const disabledToneClass =
    tone === 'logout'
      ? 'cursor-not-allowed bg-app-mint text-app-muted'
      : tone === 'success'
      ? 'cursor-not-allowed bg-app-sky/30 text-app-muted'
      : 'cursor-not-allowed bg-app-ink/10 text-app-muted';

  return (
    <div className="safe-bottom border-t border-app-ink/10 bg-app-panel/90 px-4 pt-3 backdrop-blur">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-xl px-4 py-3 font-heading text-sm font-semibold uppercase tracking-wide transition ${
          borderless ? 'border-0' : 'border'
        } ${
          disabled
            ? `${borderless ? '' : 'border-app-ink/20'} ${disabledToneClass}`
            : `${borderless ? '' : 'border-app-ink/0'} ${enabledToneClass}`
        }`}
      >
        {label}
      </button>
    </div>
  );
}
