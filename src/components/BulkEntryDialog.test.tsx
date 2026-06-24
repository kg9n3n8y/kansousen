import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { KIMARIJI_LIST } from '../data/kimariji';
import type { Entry } from '../types';
import { formatKimariji } from '../utils/formatKimariji';
import { BulkEntryDialog } from './BulkEntryDialog';

function BulkEntryHarness({
  matchId = 'test-match',
  onSkip = vi.fn()
}: {
  matchId?: string;
  onSkip?: (kimariji: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);

  const findEntryByKimariji = useCallback(
    (kimariji: string) => entries.find((entry) => entry.kimariji === kimariji) ?? null,
    [entries]
  );

  const onSave = useCallback(
    (data: { kimariji: string; locationId: string; decisionNumber: number; owner: Entry['owner'] }, existingId?: string) => {
      setEntries((prev) => {
        if (existingId) {
          return prev.map((entry) => (entry.id === existingId ? { ...entry, ...data } : entry));
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            ...data,
            formattedText: formatKimariji(data.kimariji, data.decisionNumber)
          }
        ];
      });
    },
    []
  );

  const handleSkip = useCallback(
    (kimariji: string) => {
      onSkip(kimariji);
      setEntries((prev) => prev.filter((entry) => entry.kimariji !== kimariji));
    },
    [onSkip]
  );

  return (
    <BulkEntryDialog
      open={open}
      matchId={matchId}
      onClose={() => setOpen(false)}
      findEntryByKimariji={findEntryByKimariji}
      onSave={onSave}
      onSkip={handleSkip}
    />
  );
}

async function completeCardSteps(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '自分' }));
  await user.click(screen.getByRole('button', { name: '相手陣右下段' }));
  await user.click(screen.getByRole('button', { name: '3字' }));
}

describe('BulkEntryDialog', () => {
  it('ステップ3完了後に次の札へ進む', async () => {
    const user = userEvent.setup();
    render(<BulkEntryHarness />);

    expect(screen.getByText(KIMARIJI_LIST[0])).toBeInTheDocument();

    await completeCardSteps(user);

    await waitFor(() => {
      expect(screen.getByText(KIMARIJI_LIST[1])).toBeInTheDocument();
    });
    expect(screen.queryByText(KIMARIJI_LIST[0])).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ステップ1/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('保存後にfindEntryByKimarijiが更新されても同じ札に戻らない', async () => {
    const user = userEvent.setup();
    render(<BulkEntryHarness />);

    await completeCardSteps(user);

    await waitFor(() => {
      expect(screen.getByText(KIMARIJI_LIST[1])).toBeInTheDocument();
    });

    await completeCardSteps(user);

    await waitFor(() => {
      expect(screen.getByText(KIMARIJI_LIST[2])).toBeInTheDocument();
    });
  });

  it('ステップ1で空札（スキップ）を選ぶと次の札へ進む', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<BulkEntryHarness onSkip={onSkip} />);

    expect(screen.getByText(KIMARIJI_LIST[0])).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '空札（スキップ）' }));

    expect(onSkip).toHaveBeenCalledWith(KIMARIJI_LIST[0]);

    await waitFor(() => {
      expect(screen.getByText(KIMARIJI_LIST[1])).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: /ステップ1/ })).toHaveAttribute('aria-selected', 'true');
  });
});
