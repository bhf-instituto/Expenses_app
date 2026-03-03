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
    <div className="mt-1 flex w-full items-stretch border-0 border-b border-app-ink/35 bg-transparent transition focus-within:border-app-ink/70">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        title={actionLabel}
        aria-label={actionLabel}
        className="flex h-[40px] w-10 shrink-0 items-center justify-center border-0 bg-transparent text-sm font-black text-app-ink hover:bg-app-bg/40 disabled:cursor-not-allowed disabled:opacity-45"
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
