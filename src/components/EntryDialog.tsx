import { useEffect, useState } from 'react';
import { KIMARIJI_LIST } from '../data/kimariji';
import { LOCATION_BY_ID } from '../data/boardStructure';
import { formatKimariji } from '../utils/formatKimariji';
import type { DraftEntry, Entry, Owner } from '../types';
import { Button } from './Button';
import { LocationPicker, OptionRow } from './LocationPicker';
import { Modal } from './Modal';

const DECISION_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}字` }));
const OWNER_OPTIONS = [
  { value: 'opponent', label: '相手' },
  { value: 'self', label: '自分' }
];

function createEmptyDraft(): DraftEntry {
  return { kimariji: null, locationId: null, decisionNumber: null, owner: null };
}

interface EntryDialogProps {
  open: boolean;
  onClose: () => void;
  entries: Entry[];
  editingEntry: Entry | null;
  onSave: (data: { kimariji: string; locationId: string; decisionNumber: number; owner: Owner }) => void;
  onUpdate: (
    entryId: string,
    data: { kimariji: string; locationId: string; decisionNumber: number; owner: Owner }
  ) => void;
}

export function EntryDialog({ open, onClose, entries, editingEntry, onSave, onUpdate }: EntryDialogProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DraftEntry>(createEmptyDraft);
  const isEditing = editingEntry !== null;

  useEffect(() => {
    if (!open) return;
    if (editingEntry) {
      setDraft({
        kimariji: editingEntry.kimariji,
        locationId: editingEntry.locationId,
        decisionNumber: editingEntry.decisionNumber,
        owner: editingEntry.owner
      });
      setStep(0);
    } else {
      setDraft(createEmptyDraft());
      setStep(0);
    }
  }, [open, editingEntry]);

  const usedKimariji = new Set(
    entries.filter((e) => !editingEntry || e.id !== editingEntry.id).map((e) => e.kimariji)
  );
  const kimarijiCandidates = KIMARIJI_LIST.filter((ki) => !usedKimariji.has(ki));

  const isStepComplete = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return Boolean(draft.kimariji);
      case 1:
        return Boolean(draft.owner);
      case 2:
        return Boolean(draft.locationId);
      case 3:
        return Number.isInteger(draft.decisionNumber);
      default:
        return false;
    }
  };

  const handleSave = () => {
    if (!draft.kimariji || !draft.locationId || !draft.decisionNumber || !draft.owner) return;
    const data = {
      kimariji: draft.kimariji,
      locationId: draft.locationId,
      decisionNumber: draft.decisionNumber,
      owner: draft.owner
    };
    if (isEditing && editingEntry) {
      onUpdate(editingEntry.id, data);
    } else {
      onSave(data);
    }
    onClose();
  };

  const stepTitles = ['1. 札を選ぶ', '2. どちらが取った？', '3. 取った/取られた場所', '4. 何字決まり？'];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? '取札を編集' : '取札を追加'}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} fullWidth>
            戻る
          </Button>
          <Button
            variant="primary"
            onClick={step === 3 ? handleSave : () => setStep(step + 1)}
            disabled={!isStepComplete(step)}
            fullWidth
          >
            {step === 3 ? (isEditing ? '保存' : '追加') : '次へ'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <h3 className="font-bold text-sumi">{stepTitles[step]}</h3>

        {step === 0 && (
          <div>
            {kimarijiCandidates.length === 0 ? (
              <p className="text-sm text-muted">選択できる札がありません。削除すると再度選択できます。</p>
            ) : (
              <div className="flex max-h-[50vh] flex-wrap gap-2 overflow-y-auto">
                {kimarijiCandidates.map((kimariji) => (
                  <button
                    key={kimariji}
                    type="button"
                    onClick={() => {
                      setDraft((d) => ({ ...d, kimariji }));
                      setStep(1);
                    }}
                    className={`rounded-full border border-border px-3 py-1.5 transition hover:bg-ai-light ${
                      draft.kimariji === kimariji ? 'border-ai bg-ai-light font-bold' : 'bg-washi'
                    }`}
                  >
                    {kimariji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="text-sm text-muted">札を取ったのが自分か相手か</p>
            <OptionRow
              options={OWNER_OPTIONS}
              selected={draft.owner}
              onSelect={(value) => {
                setDraft((d) => ({ ...d, owner: value as Owner }));
                setStep(2);
              }}
              vertical
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm text-muted">盤面の位置を選択</p>
            <LocationPicker
              selectedId={draft.locationId}
              onSelect={(locationId) => {
                setDraft((d) => ({ ...d, locationId }));
                setStep(3);
              }}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-sm text-muted">取ったときの決まり字を選択</p>
            <OptionRow
              options={DECISION_OPTIONS}
              selected={draft.decisionNumber}
              onSelect={(value) => {
                setDraft((d) => ({ ...d, decisionNumber: Number(value) }));
              }}
            />
            <Summary draft={draft} />
          </div>
        )}
      </div>
    </Modal>
  );
}

function Summary({ draft }: { draft: DraftEntry }) {
  const formatted = formatKimariji(draft.kimariji ?? '', draft.decisionNumber);
  const locationLabel = draft.locationId ? LOCATION_BY_ID[draft.locationId]?.label ?? '' : '未選択';
  const ownerLabel = draft.owner === 'self' ? '自分' : draft.owner === 'opponent' ? '相手' : '未選択';
  const decisionLabel = draft.decisionNumber ? `${draft.decisionNumber}字決まり` : '未入力';

  const rows = [
    { title: '札', value: formatted || '未選択' },
    { title: '取得者', value: ownerLabel },
    { title: '場所', value: locationLabel },
    { title: '何字', value: decisionLabel }
  ];

  return (
    <div className="mt-4 grid gap-2 rounded-xl border border-border bg-tatami p-4 text-sm">
      {rows.map((row) => (
        <div key={row.title}>
          <strong>{row.title}</strong> {row.value}
        </div>
      ))}
    </div>
  );
}
