import { useNavigate } from 'react-router-dom';

export default function MobileHeader({
  title,
  backTo = null,
  onBack = null,
  rightSlot = null,
  leftLabel = 'Back',
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (backTo) {
      navigate(backTo);
      return;
    }

    navigate(-1);
  };

  return (
    <header className="flex items-center gap-2 border-b border-app-ink/10 bg-white/80 px-3 py-2 backdrop-blur">
      <button
        type="button"
        onClick={handleBack}
        className="rounded-lg border border-app-ink/20 px-2 py-1 text-xs font-bold uppercase tracking-wide text-app-ink hover:bg-app-sky/30"
      >
        {leftLabel}
      </button>
      <h1 className="truncate font-heading text-sm font-semibold uppercase tracking-wide text-app-ink">
        {title}
      </h1>
      <div className="ml-auto">{rightSlot}</div>
    </header>
  );
}
