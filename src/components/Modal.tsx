import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  fullScreenMobile?: boolean;
  dense?: boolean;
}

export function Modal({ open, onClose, title, children, footer, wide, fullScreenMobile = true, dense }: ModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-20 bg-sumi/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          className={`flex max-h-[calc(100vh-2rem)] w-full flex-col bg-washi shadow-card ${
            fullScreenMobile
              ? 'h-full max-h-none rounded-none sm:h-auto sm:max-h-[calc(100vh-3rem)] sm:rounded-card'
              : 'rounded-card'
          } ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div
              className={`flex shrink-0 items-center justify-between gap-4 border-b border-border ${dense ? 'px-4 py-2.5' : 'px-5 py-4'}`}
            >
              <h2 id="modal-title" className={`font-bold text-sumi ${dense ? 'text-lg' : 'text-xl'}`}>
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-tatami"
                aria-label="閉じる"
              >
                &times;
              </button>
            </div>
          )}
          <div className={`min-h-0 flex-1 ${dense ? 'overflow-y-auto px-4 py-3' : 'overflow-y-auto px-5 py-4'}`}>
            {children}
          </div>
          {footer && (
            <div className={`flex shrink-0 gap-2 border-t border-border ${dense ? 'px-4 py-3' : 'gap-3 px-5 py-4'}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
