import MonoIcon from './MonoIcon.jsx';

export default function InlineActionInput({
  value,
  onChange = null,
  placeholder = '',
  type = 'text',
  disabled = false,
  readOnly = false,
  onAction,
  actionSymbol = '',
  actionIconSrc = '',
  actionIconColorVar = '--app-icon-action',
  actionLabel,
  actionDisabled = false,
}) {
  return (
    <div className="mt-1 flex w-full items-stretch overflow-hidden rounded-xl border border-app-ink/20 bg-app-panel focus-within:border-app-ink/50">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        title={actionLabel}
        aria-label={actionLabel}
        className="flex h-[46px] w-10 shrink-0 items-center justify-center border-l border-app-ink/20 bg-app-panel/35 text-sm font-black text-app-ink hover:bg-app-bg disabled:cursor-not-allowed disabled:opacity-45"
      >
        {actionIconSrc ? (
          <MonoIcon src={actionIconSrc} colorVar={actionIconColorVar} className="h-4 w-4" />
        ) : (
          actionSymbol
        )}
      </button>
    </div>
  );
}
