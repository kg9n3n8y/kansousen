import { useEffect, useState, type ReactNode } from 'react';
import { PWA_PROMPT_DISMISSED_KEY } from '../types';
import { Button } from './Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(PWA_PROMPT_DISMISSED_KEY) === 'true') return;
    } catch {
      return;
    }
    setVisible(true);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt || installing) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        dismiss();
      }
    } catch {
      // ignore
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  };

  if (!visible) return null;

  let instructions: ReactNode = null;
  if (!deferredPrompt) {
    if (isIos()) {
      instructions = (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>画面下の「共有」ボタンをタップ</li>
          <li>「ホーム画面に追加」を選択</li>
          <li>「追加」をタップ</li>
        </ol>
      );
    } else if (isAndroid()) {
      instructions = (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>ブラウザメニュー（⋮）をタップ</li>
          <li>「アプリをインストール」または「ホーム画面に追加」を選択</li>
        </ol>
      );
    } else {
      instructions = (
        <p className="text-sm text-muted">
          アドレスバー右側のインストールアイコンをクリックするか、ブラウザメニューから「アプリをインストール」を選択してください。
        </p>
      );
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-sumi/45" aria-hidden="true" />
      <div
        className="fixed inset-x-4 bottom-4 z-50 rounded-card bg-washi p-5 shadow-card sm:inset-x-auto sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
        role="dialog"
        aria-labelledby="pwa-install-title"
      >
        <h2 id="pwa-install-title" className="text-lg font-bold text-sumi">
          ホーム画面に追加
        </h2>
        <p className="mt-2 text-sm text-muted">
          札跡をアプリのように使うには、ホーム画面に追加してください。
        </p>
        {instructions && <div className="mt-4">{instructions}</div>}
        <div className="mt-5 flex flex-col gap-2">
          {deferredPrompt && (
            <Button variant="primary" fullWidth onClick={handleInstall} disabled={installing}>
              {installing ? 'インストール中…' : 'インストール'}
            </Button>
          )}
          <Button variant={deferredPrompt ? 'ghost' : 'primary'} fullWidth onClick={dismiss}>
            閉じる
          </Button>
        </div>
      </div>
    </>
  );
}
