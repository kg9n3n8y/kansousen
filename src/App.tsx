import { useState } from 'react';
import { useMatchHistory } from './hooks/useMatchHistory';
import { APP_URL, type Entry } from './types';
import { downloadBoardAsImage } from './utils/downloadBoard';
import { clearBulkProgress } from './utils/bulkProgress';
import { Board } from './components/Board';
import { Button } from './components/Button';
import { EntryDialog } from './components/EntryDialog';
import { BulkEntryDialog } from './components/BulkEntryDialog';
import { CardActionSheet } from './components/CardActionSheet';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DownloadDialog } from './components/DownloadDialog';
import { MatchHistoryDialog } from './components/MatchHistoryDialog';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { UpdatePrompt } from './components/UpdatePrompt';

type PendingDelete =
  | { type: 'entry'; entry: Entry }
  | { type: 'match'; matchId: string; title: string }
  | { type: 'reset' }
  | null;

export default function App() {
  const history = useMatchHistory();
  const { currentMatch } = history;

  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [downloadState, setDownloadState] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const hasModalOpen =
    entryDialogOpen ||
    bulkDialogOpen ||
    historyDialogOpen ||
    selectedEntry !== null ||
    pendingDelete !== null ||
    downloadState !== null;

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(APP_URL);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = APP_URL;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'entry') {
      history.removeEntry(pendingDelete.entry.id);
    } else if (pendingDelete.type === 'match') {
      clearBulkProgress(pendingDelete.matchId);
      history.deleteMatch(pendingDelete.matchId);
    } else if (pendingDelete.type === 'reset') {
      clearBulkProgress(currentMatch.id);
      history.resetCurrentMatch();
    }
    setPendingDelete(null);
    setSelectedEntry(null);
  };

  return (
    <div className={`min-h-screen bg-washi font-sans text-sumi ${hasModalOpen ? 'overflow-hidden' : ''}`}>
      <header className="px-5 pb-4 pt-10 text-center sm:pt-12">
        <h1 className="text-3xl font-bold sm:text-4xl">
          <ruby>
            札跡<rp>（</rp>
            <rt className="text-lg sm:text-xl">ふだあと</rt>
            <rp>）</rp>
          </ruby>
        </h1>
        <p className="mt-2 text-muted">かるた試合後分析ツール</p>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <section className="mb-8 flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => { setEditingEntry(null); setEntryDialogOpen(true); }}>
              取札を追加
            </Button>
            <Button variant="secondary" onClick={() => setBulkDialogOpen(true)}>
              一括入力
            </Button>
            <Button
              variant="secondary"
              disabled={currentMatch.entries.length === 0}
              onClick={() => {
                const result = downloadBoardAsImage(currentMatch.entries, currentMatch.title);
                if (result) setDownloadState(result);
              }}
            >
              画像で出力
            </Button>
            <Button variant="secondary" onClick={() => setHistoryDialogOpen(true)}>
              試合一覧
            </Button>
          </div>
          <label className="w-full max-w-md">
            <span className="sr-only">画像に表示するメモ</span>
            <input
              type="text"
              value={currentMatch.title}
              onChange={(e) => history.setTitle(e.target.value)}
              placeholder="画像に表示するメモを入力"
              autoComplete="off"
              className="w-full rounded-xl border border-border bg-washi px-4 py-2.5 text-sumi transition focus:border-ai focus:outline-none focus:ring-2 focus:ring-ai/20"
            />
          </label>
        </section>

        <Board
          entries={currentMatch.entries}
          title={currentMatch.title}
          onCardClick={setSelectedEntry}
        />

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button variant="danger" className="min-w-[230px]" onClick={() => setPendingDelete({ type: 'reset' })}>
            登録内容をリセット
          </Button>
          <Button variant="secondary" className="min-w-[230px]" onClick={handleCopyUrl} disabled={copyFeedback}>
            {copyFeedback ? 'コピーしました' : 'URLをコピー'}
          </Button>
        </div>
      </main>

      <EntryDialog
        open={entryDialogOpen}
        onClose={() => { setEntryDialogOpen(false); setEditingEntry(null); }}
        entries={currentMatch.entries}
        editingEntry={editingEntry}
        onSave={history.addEntry}
        onUpdate={history.updateEntry}
      />

      <BulkEntryDialog
        open={bulkDialogOpen}
        matchId={currentMatch.id}
        onClose={() => setBulkDialogOpen(false)}
        findEntryByKimariji={history.findEntryByKimariji}
        onSave={(data, existingId) => {
          if (existingId) {
            history.updateEntry(existingId, data);
          } else {
            history.addEntry(data);
          }
        }}
        onSkip={history.removeEntryByKimariji}
      />

      <MatchHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        matches={history.matches}
        currentMatchId={currentMatch.id}
        onSelect={history.switchMatch}
        onCreate={() => { history.createNewMatch(); setHistoryDialogOpen(false); }}
        onDelete={(matchId) => {
          const match = history.matches.find((m) => m.id === matchId);
          setPendingDelete({
            type: 'match',
            matchId,
            title: match?.title.trim() || '（無題）'
          });
        }}
      />

      <CardActionSheet
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onEdit={(entry) => {
          setSelectedEntry(null);
          setEditingEntry(entry);
          setEntryDialogOpen(true);
        }}
        onDelete={(entry) => {
          setSelectedEntry(null);
          setPendingDelete({ type: 'entry', entry });
        }}
      />

      <ConfirmDialog
        open={pendingDelete?.type === 'entry'}
        title="札を削除"
        message={
          pendingDelete?.type === 'entry'
            ? `「${pendingDelete.entry.formattedText}」（${pendingDelete.entry.owner === 'self' ? '自分' : '相手'}の札）を削除しますか？`
            : ''
        }
        confirmLabel="削除する"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={pendingDelete?.type === 'match'}
        title="試合を削除"
        message={
          pendingDelete?.type === 'match'
            ? `「${pendingDelete.title}」を削除しますか？この操作は取り消せません。`
            : ''
        }
        confirmLabel="削除する"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={pendingDelete?.type === 'reset'}
        title="登録内容をリセット"
        message="現在の試合の配置図とメモをすべて削除します。よろしいですか？"
        confirmLabel="リセットする"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {downloadState && (
        <DownloadDialog
          open
          dataUrl={downloadState.dataUrl}
          fileName={downloadState.fileName}
          title={currentMatch.title}
          onClose={() => setDownloadState(null)}
        />
      )}

      <PwaInstallPrompt />
      <UpdatePrompt />
    </div>
  );
}
