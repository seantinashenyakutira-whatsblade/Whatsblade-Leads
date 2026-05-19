'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope);

            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker?.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available');
                }
              });
            });
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      });
    }

    const meta = document.createElement('meta');
    meta.name = 'apple-mobile-web-app-capable';
    meta.content = 'yes';
    document.head.appendChild(meta);

    const metaTheme = document.createElement('meta');
    metaTheme.name = 'apple-mobile-web-app-status-bar-style';
    metaTheme.content = 'black-translucent';
    document.head.appendChild(metaTheme);

    const linkIcon192 = document.createElement('link');
    linkIcon192.rel = 'apple-touch-icon';
    linkIcon192.href = '/icons/icon-192.png';
    document.head.appendChild(linkIcon192);

    const linkIcon512 = document.createElement('link');
    linkIcon512.rel = 'apple-touch-icon';
    linkIcon512.sizes = '512x512';
    linkIcon512.href = '/icons/icon-512.png';
    document.head.appendChild(linkIcon512);
  }, []);

  return null;
}
