function MobileHeader({ title, leftAction = null, rightAction = null }) {
  function renderAction(action) {
    if (!action) return <span />

    if (!action.onClick) {
      return (
        <span className="mobile-header__text">
          {action.label}
        </span>
      )
    }

    return (
      <button
        className={`mobile-header__action ${action.variant === 'danger' ? 'is-danger' : ''}`}
        disabled={Boolean(action.disabled)}
        onClick={action.onClick}
        type="button"
      >
        {action.label}
      </button>
    )
  }

  return (
    <header className="mobile-header">
      <div className="mobile-header__left">
        {renderAction(leftAction)}
      </div>

      <h1 className="mobile-header__title">{title}</h1>

      <div className="mobile-header__right">
        {renderAction(rightAction)}
      </div>
    </header>
  )
}

export default MobileHeader
