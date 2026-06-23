export type Owner = 'self' | 'opponent';

export interface Entry {
  id: string;
  kimariji: string;
  locationId: string;
  decisionNumber: number;
  owner: Owner;
  formattedText: string;
}

export interface DraftEntry {
  kimariji: string | null;
  locationId: string | null;
  decisionNumber: number | null;
  owner: Owner | null;
}

export interface MatchRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  entries: Entry[];
}

export interface HistoryState {
  currentMatchId: string;
  matches: MatchRecord[];
}

export const HISTORY_STORAGE_KEY = 'kansousen-history-v1';
export const PWA_PROMPT_DISMISSED_KEY = 'kansousen-pwa-prompt-dismissed';

export const APP_URL = 'https://kg9n3n8y.github.io/kansousen/';
