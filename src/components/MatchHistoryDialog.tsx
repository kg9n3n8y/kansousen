import type { MatchRecord } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';

interface MatchHistoryDialogProps {
  open: boolean;
  matches: MatchRecord[];
  currentMatchId: string;
  onClose: () => void;
  onSelect: (matchId: string) => void;
  onCreate: () => void;
  onDelete: (matchId: string) => void;
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export function MatchHistoryDialog({
  open,
  matches,
  currentMatchId,
  onClose,
  onSelect,
  onCreate,
  onDelete
}: MatchHistoryDialogProps) {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="試合一覧"
      wide
      footer={
        <Button variant="primary" fullWidth onClick={onCreate}>
          新規試合
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <p className="text-center text-muted">保存された試合がありません</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((match) => {
            const isCurrent = match.id === currentMatchId;
            const displayTitle = match.title.trim() || '（無題）';
            return (
              <li
                key={match.id}
                className={`flex items-center gap-3 rounded-card border p-3 transition ${
                  isCurrent ? 'border-ai bg-ai-light' : 'border-border bg-washi'
                }`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    onSelect(match.id);
                    onClose();
                  }}
                >
                  <p className="truncate font-semibold text-sumi">{displayTitle}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(match.updatedAt)} · {match.entries.length}札
                    {isCurrent && ' · 編集中'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(match.id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm text-beni transition hover:bg-beni/10"
                  aria-label={`${displayTitle}を削除`}
                >
                  削除
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
