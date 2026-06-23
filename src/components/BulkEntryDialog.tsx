import { useCallback, useEffect, useRef, useState } from 'react';
import { KIMARIJI_LIST } from '../data/kimariji';
import type { DraftEntry, Entry, Owner } from '../types';
import { clearBulkProgress, loadBulkProgress, saveBulkProgress } from '../utils/bulkProgress';
import { Button } from './Button';
import { LocationPicker, OptionRow } from './LocationPicker';
import { Modal } from './Modal';

const DECISION_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}字` }));
const OWNER_OPTIONS = [
  { value: 'opponent', label: '相手' },
  { value: 'self', label: '自分' }
];

const STEP_TITLES = ['どちらが取った？', '取った/取られた場所', '何字決まり？'];

interface BulkEntryDialogProps {
  open: boolean;
  matchId: string;
  onClose: () => void;
  findEntryByKimariji: (kimariji: string) => Entry | null;
  onSave: (data: { kimariji: string; locationId: string; decisionNumber: number; owner: Owner }, existingId?: string) => void;
  onSkip: (kimariji: string) => void;
}

export function BulkEntryDialog({ open, matchId, onClose, findEntryByKimariji, onSave, onSkip }: BulkEntryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DraftEntry>({ kimariji: null, locationId: null, decisionNumber: null, owner: null });
  const [baseEntry, setBaseEntry] = useState<Entry | null>(null);
  const skipIndexLoadRef = useRef(false);

  const kimariji = KIMARIJI_LIST[currentIndex];
  const isLast = currentIndex === KIMARIJI_LIST.length - 1;

  const loadCardAtIndex = useCallback(
    (index: number, options?: { restoreStep?: number }) => {
      const cardKimariji = KIMARIJI_LIST[index];
      const existing = findEntryByKimariji(cardKimariji);
      setBaseEntry(existing);
      setDraft({
        kimariji: cardKimariji,
        locationId: existing?.locationId ?? null,
        decisionNumber: existing?.decisionNumber ?? null,
        owner: existing?.owner ?? null
      });
      setStep(options?.restoreStep ?? 0);
    },
    [findEntryByKimariji]
  );

  const handleClose = useCallback(
    (completed = false) => {
      if (completed) {
        clearBulkProgress(matchId);
      } else {
        saveBulkProgress(matchId, currentIndex, step);
      }
      onClose();
    },
    [matchId, currentIndex, step, onClose]
  );

  useEffect(() => {
    if (!open) return;
    const saved = loadBulkProgress(matchId);
    const index = saved?.currentIndex ?? 0;
    const restoreStep = saved?.step ?? 0;
    skipIndexLoadRef.current = true;
    setCurrentIndex(index);
    loadCardAtIndex(index, { restoreStep });
  }, [open, matchId, loadCardAtIndex]);

  useEffect(() => {
    if (!open) return;
    if (skipIndexLoadRef.current) {
      skipIndexLoadRef.current = false;
      return;
    }
    loadCardAtIndex(currentIndex);
  }, [open, currentIndex, loadCardAtIndex]);

  useEffect(() => {
    if (!open) return;
    saveBulkProgress(matchId, currentIndex, step);
  }, [open, matchId, currentIndex, step]);

  const isDraftComplete = Boolean(draft.locationId && draft.decisionNumber && draft.owner);
  const isUnchanged =
    baseEntry !== null &&
    draft.locationId === baseEntry.locationId &&
    draft.decisionNumber === baseEntry.decisionNumber &&
    draft.owner === baseEntry.owner;
  const canAdvance = isUnchanged || isDraftComplete;

  const advanceToNextCard = useCallback(() => {
    if (isLast) {
      handleClose(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
  }, [isLast, handleClose]);

  const commitIfNeeded = useCallback(
    (nextDraft: DraftEntry) => {
      if (!nextDraft.kimariji || !nextDraft.locationId || !nextDraft.decisionNumber || !nextDraft.owner) {
        return;
      }

      const hasChanges =
        !baseEntry ||
        nextDraft.locationId !== baseEntry.locationId ||
        nextDraft.decisionNumber !== baseEntry.decisionNumber ||
        nextDraft.owner !== baseEntry.owner;

      if (hasChanges) {
        onSave(
          {
            kimariji: nextDraft.kimariji,
            locationId: nextDraft.locationId,
            decisionNumber: nextDraft.decisionNumber,
            owner: nextDraft.owner
          },
          baseEntry?.id
        );
      }
    },
    [baseEntry, onSave]
  );

  const saveAndNext = () => {
    if (!canAdvance) return;
    commitIfNeeded(draft);
    advanceToNextCard();
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSkip = () => {
    onSkip(kimariji);
    advanceToNextCard();
  };

  const handleOwnerSelect = (value: string | number) => {
    setDraft((d) => ({ ...d, owner: value as Owner }));
    setStep(1);
  };

  const handleLocationSelect = (locationId: string) => {
    setDraft((d) => ({ ...d, locationId }));
    setStep(2);
  };

  const handleDecisionSelect = (value: string | number) => {
    const decisionNumber = Number(value);
    const nextDraft: DraftEntry = { ...draft, decisionNumber };
    setDraft(nextDraft);
    if (nextDraft.locationId && nextDraft.owner) {
      commitIfNeeded(nextDraft);
      advanceToNextCard();
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => handleClose(false)}
      title="一括入力"
      wide
      dense
      footer={
        <>
          <Button variant="secondary" onClick={goPrev} disabled={currentIndex === 0} fullWidth>
            前の札
          </Button>
          <Button variant="primary" onClick={saveAndNext} disabled={!canAdvance} fullWidth>
            {isLast ? '終了' : '次の札へ'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center rounded-card bg-ai-light py-3">
          <span className="text-2xl font-bold text-ai-dark">{kimariji}</span>
        </div>

        <div className="flex gap-1.5" role="tablist" aria-label="入力ステップ">
          {STEP_TITLES.map((title, index) => {
            const isCurrent = step === index;
            const isCompleted = index < step;
            const canNavigate = index <= step;

            return (
              <button
                key={title}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={
                  isCompleted
                    ? `ステップ${index + 1}: ${title}（タップして戻る）`
                    : `ステップ${index + 1}: ${title}`
                }
                disabled={!canNavigate}
                onClick={() => canNavigate && setStep(index)}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-semibold transition ${
                  isCurrent
                    ? 'bg-ai text-white'
                    : isCompleted
                      ? 'cursor-pointer bg-ai-light text-ai-dark hover:bg-ai/20'
                      : 'bg-tatami text-muted'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <h3 className="text-sm font-bold text-sumi">{STEP_TITLES[step]}</h3>

        {step === 0 && (
          <OptionRow
            bulk
            compact
            options={OWNER_OPTIONS}
            selected={draft.owner}
            onSelect={handleOwnerSelect}
            vertical
          />
        )}

        {step === 1 && (
          <>
            <LocationPicker bulk compact selectedId={draft.locationId} onSelect={handleLocationSelect} />
            <Button
              variant="ghost"
              fullWidth
              className="border border-dashed border-border py-2.5 text-muted"
              onClick={handleSkip}
            >
              空札（スキップ）
            </Button>
          </>
        )}

        {step === 2 && (
          <OptionRow
            bulk
            compact
            options={DECISION_OPTIONS}
            selected={draft.decisionNumber}
            onSelect={handleDecisionSelect}
          />
        )}
      </div>
    </Modal>
  );
}
