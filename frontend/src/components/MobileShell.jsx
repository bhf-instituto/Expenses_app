import { Link } from 'react-router-dom';

export default function MobileShell({ title, backTo, rightSlot, children, footer }) {
  return (
    <div className="mobile-shell">
      <header className="mobile-topbar">
        <div className="mobile-topbar-row">
          {backTo ? (
            <Link className="button is-small is-light" to={backTo}>
              back
            </Link>
          ) : (
            <span />
          )}
          {rightSlot}
        </div>
        <h1 className="title is-4 has-text-danger">{title}</h1>
      </header>
      <main className="mobile-scroll-area">{children}</main>
      {footer ? <footer className="mobile-footer">{footer}</footer> : null}
    </div>
  );
}
