export default function ListCardButton({
  title,
  subtitle,
  onClick,
  accent = 'bg-app-panel',
  disabled = false,
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite = null,
}) {
  const handleFavoriteClick = (event) => {
    event.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-2xl border border-app-ink/20 px-4 py-8 text-left shadow-sm transition ${
          showFavorite ? 'pr-14' : ''
        } ${
          disabled ? 'cursor-not-allowed opacity-45' : 'hover:-translate-y-0.5 hover:shadow-md'
        } ${accent}`}
      >
        <p className="font-heading text-xl font-semibold text-app-ink">{title}</p>
        {/* {subtitle ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-app-muted">{subtitle}</p>
        ) : null} */}
      </button>

      {showFavorite ? (
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${
            isFavorite
              ? 'border-app-ink/30 bg-app-warning text-app-ink'
              : 'border-app-ink/20 bg-white/85 text-app-muted hover:bg-app-bg'
          }`}
          aria-label={isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
          title={isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      ) : null}
    </div>
  );
}
