import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { KIMARIJI_LIST } from '../data/kimariji';
import type { Entry } from '../types';
import { formatKimariji } from '../utils/formatKimariji';
import { BulkEntryDialog } from './BulkEntryDialog';

function BulkEntryHarness({ matchId = 'test-match' }: { matchId?: string }) {
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

  return (
    <BulkEntryDialog
      open={open}
      matchId={matchId}
      onClose={() => setOpen(false)}
      findEntryByKimariji={findEntryByKimariji}
      onSave={onSave}
      onSkip={vi.fn()}
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
});
