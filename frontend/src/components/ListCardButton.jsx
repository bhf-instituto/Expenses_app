import starEmptyIcon from '../assets/icons/star-empty-icon.svg';
import starFullIcon from '../assets/icons/star-full-icon.svg';
import MonoIcon from './MonoIcon.jsx';

export default function ListCardButton({
  title,
  subtitle: _subtitle,
  onClick,
  accent = 'bg-app-panel',
  disabled = false,
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite = null,
  size = 'default',
}) {
  void _subtitle;

  const handleFavoriteClick = (event) => {
    event.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite();
    }
  };

  const sizeClasses = {
    default: 'px-4 py-8',
    compact: 'px-4 py-4',
    fill: 'h-full px-4 py-4',
  };

  const buttonSizeClass = sizeClasses[size] || sizeClasses.default;
  const titleClassName =
    size === 'fill'
      ? 'font-heading text-2xl font-semibold text-app-ink'
      : 'font-heading text-xl font-semibold text-app-ink';

  return (
    <div className={`relative ${size === 'fill' ? 'h-full' : ''}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-2xl border border-app-ink/20 text-left shadow-sm transition ${
          showFavorite ? 'pr-16' : ''
        } ${
          disabled ? 'cursor-not-allowed opacity-45' : 'hover:-translate-y-0.5 hover:shadow-md'
        } ${buttonSizeClass} ${accent}`}
      >
        <p className={titleClassName}>{title}</p>
        {/* {subtitle ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-app-muted">{subtitle}</p>
        ) : null} */}
      </button>

      {showFavorite ? (
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border text-sm transition ${
            isFavorite
              ? 'border-app-ink/30 bg-app-warning text-app-ink'
              : 'border-app-ink/20 bg-app-panel/85 text-app-muted hover:bg-app-bg'
          }`}
          aria-label={isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
          title={isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
        >
          <MonoIcon
            src={isFavorite ? starFullIcon : starEmptyIcon}
            colorVar={isFavorite ? '--app-icon-star-full' : '--app-icon-star-empty'}
            className="h-5 w-5"
          />
        </button>
      ) : null}
    </div>
  );
}
