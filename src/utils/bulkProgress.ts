export const BULK_PROGRESS_STORAGE_KEY = 'kansousen-bulk-progress-v1';

interface BulkProgressEntry {
  currentIndex: number;
  step: number;
}

type BulkProgressStore = Record<string, BulkProgressEntry>;

function readStore(): BulkProgressStore {
  if (typeof window === 'undefined' || !('localStorage' in window)) return {};
  try {
    const raw = window.localStorage.getItem(BULK_PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BulkProgressStore;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: BulkProgressStore) {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  try {
    if (Object.keys(store).length === 0) {
      window.localStorage.removeItem(BULK_PROGRESS_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(BULK_PROGRESS_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('一括入力の進捗保存に失敗しました:', error);
  }
}

export function loadBulkProgress(matchId: string): BulkProgressEntry | null {
  const entry = readStore()[matchId];
  if (!entry) return null;
  if (!Number.isInteger(entry.currentIndex) || !Number.isInteger(entry.step)) return null;
  return entry;
}

export function saveBulkProgress(matchId: string, currentIndex: number, step: number) {
  const store = readStore();
  store[matchId] = { currentIndex, step };
  writeStore(store);
}

export function clearBulkProgress(matchId: string) {
  const store = readStore();
  if (!(matchId in store)) return;
  delete store[matchId];
  writeStore(store);
}
