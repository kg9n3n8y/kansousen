import type { Entry } from '../types';
import { Button } from './Button';

interface CardActionSheetProps {
  entry: Entry | null;
  onClose: () => void;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export function CardActionSheet({ entry, onClose, onEdit, onDelete }: CardActionSheetProps) {
  if (!entry) return null;

  const ownerLabel = entry.owner === 'self' ? '自分' : '相手';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-sumi/45" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-washi p-5 shadow-sheet sm:inset-x-auto sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-action-title"
      >
        <div className="mb-4 text-center">
          <p id="card-action-title" className="text-lg font-bold text-sumi">
            <span className={entry.owner === 'self' ? 'text-sumi' : 'text-beni'}>{entry.formattedText}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{ownerLabel}の札</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="primary" fullWidth onClick={() => onEdit(entry)}>
            編集
          </Button>
          <Button variant="danger" fullWidth onClick={() => onDelete(entry)}>
            削除
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </>
  );
}
