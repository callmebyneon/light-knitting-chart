'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let isCancelled = false;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        if (!isCancelled && process.env.NODE_ENV !== 'production') {
          console.debug('[PWA] service worker registered', registration.scope);
        }
      } catch (error) {
        if (!isCancelled && process.env.NODE_ENV !== 'production') {
          console.debug('[PWA] service worker registration failed', error);
        }
      }
    };

    registerServiceWorker();

    return () => {
      isCancelled = true;
    };
  }, []);

  return null;
}
