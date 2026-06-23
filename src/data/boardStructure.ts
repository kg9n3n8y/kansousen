export interface BoardLocation {
  id: string;
  label: string;
  columnIndex: number;
  rowIndex: number;
}

export const BOARD_STRUCTURE = [
  [
    { id: 'opponent-right-lower', label: '相手陣右下段', columnIndex: 0 },
    { id: 'opponent-left-lower', label: '相手陣左下段', columnIndex: 1 }
  ],
  [
    { id: 'opponent-right-middle', label: '相手陣右中段', columnIndex: 0 },
    { id: 'opponent-left-middle', label: '相手陣左中段', columnIndex: 1 }
  ],
  [
    { id: 'opponent-right-upper', label: '相手陣右上段', columnIndex: 0 },
    { id: 'opponent-left-upper', label: '相手陣左上段', columnIndex: 1 }
  ],
  [
    { id: 'self-left-upper', label: '自陣左上段', columnIndex: 0 },
    { id: 'self-right-upper', label: '自陣右上段', columnIndex: 1 }
  ],
  [
    { id: 'self-left-middle', label: '自陣左中段', columnIndex: 0 },
    { id: 'self-right-middle', label: '自陣右中段', columnIndex: 1 }
  ],
  [
    { id: 'self-left-lower', label: '自陣左下段', columnIndex: 0 },
    { id: 'self-right-lower', label: '自陣右下段', columnIndex: 1 }
  ]
] as const;

export const LOCATION_BY_ID: Record<string, BoardLocation> = BOARD_STRUCTURE.flat().reduce(
  (acc, location, index) => {
    acc[location.id] = {
      ...location,
      rowIndex: Math.floor(index / 2)
    };
    return acc;
  },
  {} as Record<string, BoardLocation>
);
