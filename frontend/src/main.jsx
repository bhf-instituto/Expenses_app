import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.jsx';

registerSW({ immediate: true });

const setAppViewportHeight = () => {
  if (typeof window === 'undefined') return;
  const height = window.visualViewport?.height || window.innerHeight;
  if (!height) return;
  document.documentElement.style.setProperty('--app-vh', `${height * 0.01}px`);
};

setAppViewportHeight();
window.addEventListener('resize', setAppViewportHeight);
window.addEventListener('orientationchange', setAppViewportHeight);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setAppViewportHeight);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
