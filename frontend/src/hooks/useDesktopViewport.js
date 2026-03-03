import { useEffect, useState } from 'react';

const DESKTOP_QUERY = '(min-width: 1024px)';

const readDesktopState = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(DESKTOP_QUERY).matches;
};

export default function useDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(readDesktopState);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event) => {
      setIsDesktop(event.matches);
    };

    mediaQuery.addEventListener('change', onChange);

    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  return isDesktop;
}
