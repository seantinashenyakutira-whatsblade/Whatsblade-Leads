'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { X, Download, Smartphone } from 'lucide-react';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, handleInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isInstalled || dismissed) return;

    const hasSeen = localStorage.getItem('pwa-install-dismissed');
    if (hasSeen) return;

    if (isInstallable || isIOS) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isIOS, dismissed]);

  if (!show || isInstalled) return null;

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm md:bottom-8 md:left-auto md:right-8 md:mx-0">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Install Whatsblade Leads</h3>
              <p className="text-xs text-zinc-400">
                {isIOS
                  ? 'Tap Share → Add to Home Screen'
                  : 'Get faster access and offline support'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="min-h-[48px] min-w-[48px] p-2 text-zinc-400 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isIOS && (
          <button
            onClick={handleInstall}
            className="mt-3 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
