import { BOARD_STRUCTURE } from '../data/boardStructure';

interface LocationPickerProps {
  selectedId: string | null;
  onSelect: (locationId: string) => void;
  compact?: boolean;
  bulk?: boolean;
}

export function LocationPicker({ selectedId, onSelect, compact, bulk }: LocationPickerProps) {
  return (
    <div
      className={`grid grid-cols-2 overflow-hidden rounded-card border border-border ${compact ? '' : 'mt-2'}`}
    >
      {BOARD_STRUCTURE.flat().map((location) => (
        <button
          key={location.id}
          type="button"
          onClick={() => onSelect(location.id)}
          className={`border border-border bg-washi text-center transition hover:bg-ai-light ${
            bulk
              ? 'min-h-[2.9rem] px-1 py-3 text-xs leading-tight'
              : compact
                ? 'px-1 py-2 text-xs leading-tight'
                : 'px-2 py-3 text-sm sm:text-base'
          } ${selectedId === location.id ? 'bg-ai-light font-bold text-ai-dark' : ''}`}
        >
          {location.label}
        </button>
      ))}
    </div>
  );
}

interface OptionRowProps {
  options: { value: string | number; label: string }[];
  selected: string | number | null;
  onSelect: (value: string | number) => void;
  vertical?: boolean;
  compact?: boolean;
  bulk?: boolean;
}

export function OptionRow({ options, selected, onSelect, vertical, compact, bulk }: OptionRowProps) {
  return (
    <div
      className={`flex flex-wrap ${compact ? (bulk && vertical ? 'gap-3' : 'gap-1.5') : 'mt-4 gap-2'} ${vertical ? 'flex-col' : ''}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`rounded-xl border border-border bg-washi text-center transition hover:bg-ai-light ${
            bulk
              ? vertical
                ? 'w-full min-h-[4.5rem] py-5 text-2xl font-semibold'
                : 'min-h-[3.25rem] min-w-[3.25rem] flex-1 px-3 py-3 text-lg'
              : compact
                ? vertical
                  ? 'w-full py-2 text-base'
                  : 'min-w-[48px] flex-1 px-2 py-2 text-base'
                : vertical
                  ? 'w-full px-4 py-3'
                  : 'min-w-[60px] px-4 py-2.5'
          } ${selected === option.value ? 'border-ai bg-ai-light font-bold text-ai-dark' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
