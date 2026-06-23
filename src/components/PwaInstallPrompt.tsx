import { useEffect, useState, type ReactNode } from 'react';
import { PWA_PROMPT_DISMISSED_KEY } from '../types';
import { Button } from './Button';

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

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(PWA_PROMPT_DISMISSED_KEY) === 'true') return;
    } catch {
      return;
    }
    setVisible(true);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  let instructions: ReactNode;
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
        <div className="mt-4">{instructions}</div>
        <div className="mt-5">
          <Button variant="primary" fullWidth onClick={dismiss}>
            閉じる
          </Button>
        </div>
      </div>
    </>
  );
}
