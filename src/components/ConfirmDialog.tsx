import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  variant = 'danger',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      fullScreenMobile={false}
      footer={
        <div className="flex w-full flex-col gap-2">
          <Button variant={variant} fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" fullWidth onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      }
    >
      <div className="text-center">
        <h2 className="text-xl font-bold text-sumi">{title}</h2>
        <p className="mt-3 text-muted">{message}</p>
      </div>
    </Modal>
  );
}
