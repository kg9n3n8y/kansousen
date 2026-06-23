import { useCallback, useEffect, useMemo, useState } from 'react';
import { createId } from '../utils/createId';
import { formatKimariji } from '../utils/formatKimariji';
import { HISTORY_STORAGE_KEY, type Entry, type HistoryState, type MatchRecord, type Owner } from '../types';

function createEmptyMatch(): MatchRecord {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: '',
    createdAt: now,
    updatedAt: now,
    entries: []
  };
}

function createEntryRecord(data: {
  kimariji: string;
  locationId: string;
  decisionNumber: number;
  owner: Owner;
  id?: string;
}): Entry {
  return {
    id: data.id ?? createId(),
    kimariji: data.kimariji,
    locationId: data.locationId,
    decisionNumber: data.decisionNumber,
    owner: data.owner,
    formattedText: formatKimariji(data.kimariji, data.decisionNumber)
  };
}

function loadHistory(): HistoryState {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    const match = createEmptyMatch();
    return { currentMatchId: match.id, matches: [match] };
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      const match = createEmptyMatch();
      return { currentMatchId: match.id, matches: [match] };
    }

    const parsed = JSON.parse(raw) as HistoryState;
    if (!parsed?.matches?.length || !parsed.currentMatchId) {
      const match = createEmptyMatch();
      return { currentMatchId: match.id, matches: [match] };
    }

    const matches = parsed.matches
      .map((match) => sanitizeMatch(match))
      .filter((match): match is MatchRecord => match !== null);

    if (matches.length === 0) {
      const match = createEmptyMatch();
      return { currentMatchId: match.id, matches: [match] };
    }

    const currentMatchId = matches.some((m) => m.id === parsed.currentMatchId)
      ? parsed.currentMatchId
      : matches[0].id;

    return { currentMatchId, matches };
  } catch {
    const match = createEmptyMatch();
    return { currentMatchId: match.id, matches: [match] };
  }
}

function sanitizeMatch(match: unknown): MatchRecord | null {
  if (typeof match !== 'object' || match === null) return null;
  const record = match as Partial<MatchRecord>;
  if (typeof record.id !== 'string') return null;

  const entries = Array.isArray(record.entries)
    ? record.entries
        .map((entry) => {
          if (typeof entry !== 'object' || entry === null) return null;
          const e = entry as Partial<Entry>;
          if (
            typeof e.id !== 'string' ||
            typeof e.kimariji !== 'string' ||
            typeof e.locationId !== 'string' ||
            typeof e.owner !== 'string'
          ) {
            return null;
          }
          const decisionNumber = Number(e.decisionNumber);
          if (!Number.isInteger(decisionNumber)) return null;
          return createEntryRecord({
            id: e.id,
            kimariji: e.kimariji,
            locationId: e.locationId,
            decisionNumber,
            owner: e.owner as Owner
          });
        })
        .filter((e): e is Entry => e !== null)
    : [];

  const now = new Date().toISOString();
  return {
    id: record.id,
    title: typeof record.title === 'string' ? record.title : '',
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : now,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : now,
    entries
  };
}

function persistHistory(state: HistoryState) {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('状態の保存に失敗しました:', error);
  }
}

export function useMatchHistory() {
  const [history, setHistory] = useState<HistoryState>(loadHistory);

  const currentMatch = useMemo(
    () => history.matches.find((m) => m.id === history.currentMatchId) ?? history.matches[0],
    [history]
  );

  useEffect(() => {
    persistHistory(history);
  }, [history]);

  const updateCurrentMatch = useCallback((updater: (match: MatchRecord) => MatchRecord) => {
    setHistory((prev) => {
      const now = new Date().toISOString();
      const matches = prev.matches.map((match) => {
        if (match.id !== prev.currentMatchId) return match;
        return { ...updater(match), updatedAt: now };
      });
      return { ...prev, matches };
    });
  }, []);

  const setTitle = useCallback(
    (title: string) => {
      updateCurrentMatch((match) => ({ ...match, title }));
    },
    [updateCurrentMatch]
  );

  const setEntries = useCallback(
    (entries: Entry[]) => {
      updateCurrentMatch((match) => ({ ...match, entries }));
    },
    [updateCurrentMatch]
  );

  const addEntry = useCallback(
    (data: { kimariji: string; locationId: string; decisionNumber: number; owner: Owner }) => {
      updateCurrentMatch((match) => ({
        ...match,
        entries: [...match.entries.filter((e) => e.kimariji !== data.kimariji), createEntryRecord(data)]
      }));
    },
    [updateCurrentMatch]
  );

  const updateEntry = useCallback(
    (entryId: string, data: { kimariji: string; locationId: string; decisionNumber: number; owner: Owner }) => {
      updateCurrentMatch((match) => ({
        ...match,
        entries: match.entries.map((entry) =>
          entry.id === entryId
            ? createEntryRecord({ ...data, id: entryId })
            : entry.kimariji === data.kimariji && entry.id !== entryId
              ? null
              : entry
        ).filter((e): e is Entry => e !== null)
      }));
    },
    [updateCurrentMatch]
  );

  const removeEntry = useCallback(
    (entryId: string) => {
      updateCurrentMatch((match) => ({
        ...match,
        entries: match.entries.filter((e) => e.id !== entryId)
      }));
    },
    [updateCurrentMatch]
  );

  const removeEntryByKimariji = useCallback(
    (kimariji: string) => {
      updateCurrentMatch((match) => ({
        ...match,
        entries: match.entries.filter((e) => e.kimariji !== kimariji)
      }));
    },
    [updateCurrentMatch]
  );

  const resetCurrentMatch = useCallback(() => {
    updateCurrentMatch((match) => ({ ...match, title: '', entries: [] }));
  }, [updateCurrentMatch]);

  const createNewMatch = useCallback(() => {
    const match = createEmptyMatch();
    setHistory((prev) => ({
      currentMatchId: match.id,
      matches: [match, ...prev.matches]
    }));
  }, []);

  const switchMatch = useCallback((matchId: string) => {
    setHistory((prev) => {
      if (!prev.matches.some((m) => m.id === matchId)) return prev;
      return { ...prev, currentMatchId: matchId };
    });
  }, []);

  const deleteMatch = useCallback((matchId: string) => {
    setHistory((prev) => {
      const remaining = prev.matches.filter((m) => m.id !== matchId);
      if (remaining.length === 0) {
        const match = createEmptyMatch();
        return { currentMatchId: match.id, matches: [match] };
      }
      const currentMatchId =
        prev.currentMatchId === matchId ? remaining[0].id : prev.currentMatchId;
      return { currentMatchId, matches: remaining };
    });
  }, []);

  const findEntryByKimariji = useCallback(
    (kimariji: string) => currentMatch.entries.find((e) => e.kimariji === kimariji) ?? null,
    [currentMatch.entries]
  );

  return {
    currentMatch,
    matches: history.matches,
    setTitle,
    setEntries,
    addEntry,
    updateEntry,
    removeEntry,
    removeEntryByKimariji,
    resetCurrentMatch,
    createNewMatch,
    switchMatch,
    deleteMatch,
    findEntryByKimariji
  };
}
