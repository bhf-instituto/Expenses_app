import starEmptyIcon from '../assets/icons/star-empty-icon.svg';
import starFullIcon from '../assets/icons/star-full-icon.svg';
import MonoIcon from './MonoIcon.jsx';

export default function ListCardButton({
  title,
  subtitle: _subtitle,
  onClick,
  accent = 'bg-app-mint',
  disabled = false,
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite = null,
  size = 'default',
  centerContent = false,
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
  const backgroundClass = isFavorite ? 'bg-indigo-900' : accent;
  const contentAlignmentClass = centerContent ? 'items-center text-center' : 'items-start text-left';
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
        className={`flex w-full flex-col justify-center rounded-2xl border-0 border-app-ink/20 shadow-md transition uppercase ${
          showFavorite ? 'pr-16' : ''
        } ${
          disabled ? 'cursor-not-allowed opacity-45' : 'hover:-translate-y-0.5 hover:shadow-md'
        } ${buttonSizeClass} ${contentAlignmentClass} ${backgroundClass}`}
      >
        <p className={titleClassName}>{title}</p>
      </button>

      {showFavorite ? (
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent text-sm transition ${
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
            className="h-5 w-6"
          />
        </button>
      ) : null}
    </div>
  );
}
