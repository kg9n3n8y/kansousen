import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './Button';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return;
      const checkUpdate = () => registration.update();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkUpdate();
      });
      window.addEventListener('focus', checkUpdate);
    }
  });

  if (!needRefresh) return null;

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 rounded-card border border-border bg-washi p-4 shadow-card sm:inset-x-auto sm:right-4 sm:max-w-sm"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-sumi">新しいバージョンがあります</p>
      <div className="flex gap-2">
        <Button
          variant="primary"
          className="flex-1"
          onClick={() => updateServiceWorker(true)}
        >
          更新する
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => setNeedRefresh(false)}>
          後で
        </Button>
      </div>
    </div>
  );
}
