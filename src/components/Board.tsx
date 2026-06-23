import { BOARD_STRUCTURE } from '../data/boardStructure';
import type { Entry } from '../types';

interface BoardProps {
  entries: Entry[];
  title: string;
  onCardClick: (entry: Entry) => void;
}

export function Board({ entries, title, onCardClick }: BoardProps) {
  const entriesByLocation = new Map<string, Entry[]>();
  entries.forEach((entry) => {
    const list = entriesByLocation.get(entry.locationId) ?? [];
    list.push(entry);
    entriesByLocation.set(entry.locationId, list);
  });

  return (
    <section className="rounded-card bg-tatami p-4 shadow-card sm:p-6">
      <h2 className="text-lg font-bold text-sumi sm:text-xl">配置図</h2>
      {title.trim() && (
        <p className="mt-2 text-center text-base font-semibold text-sumi">{title.trim()}</p>
      )}
      <div className="mt-4 -mx-1 overflow-x-auto pb-2 sm:mx-0">
        <div className="mx-auto grid min-w-[640px] grid-cols-2 overflow-hidden rounded-xl border-2 border-border">
          {BOARD_STRUCTURE.flat().map((location) => {
            const slotEntries = entriesByLocation.get(location.id) ?? [];
            const isRight = location.columnIndex === 1;
            return (
              <div
                key={location.id}
                className="min-h-[120px] border-b border-r border-border bg-washi last:border-b-0 even:border-r-0 sm:min-h-[140px]"
              >
                <div
                  className={`flex items-start gap-2 p-3 sm:gap-3 sm:p-5 ${isRight ? 'justify-end' : 'justify-start'}`}
                >
                  {slotEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onCardClick(entry)}
                      className={`card-vertical cursor-pointer rounded-lg px-1 py-2 text-base transition hover:bg-ai-light hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ai sm:text-lg ${
                        entry.owner === 'self' ? 'text-sumi' : 'text-beni'
                      }`}
                      aria-label={`${entry.owner === 'self' ? '自分' : '相手'}が取った札「${entry.formattedText}」`}
                    >
                      {entry.formattedText}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted">黒字は自分の取り　赤字は相手の取り</p>
    </section>
  );
}
