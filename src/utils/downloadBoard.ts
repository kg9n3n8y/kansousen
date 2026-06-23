import { BOARD_STRUCTURE, LOCATION_BY_ID } from '../data/boardStructure';
import type { Entry } from '../types';

export function downloadBoardAsImage(entries: Entry[], boardTitle: string): {
  dataUrl: string;
  fileName: string;
} | null {
  if (entries.length === 0) return null;

  const rowCount = BOARD_STRUCTURE.length;
  const colCount = 2;
  const rowHeight = 300;
  const baseWidth = 180;
  const cardSpacing = 48;
  const padding = 20;
  const fontSize = 28;
  const charSpacing = 32;
  const fontWeight = '600';
  const legendText = '黒字は自分の取り　赤字は相手の取り';
  const legendFontSize = 18;
  const legendPadding = 16;
  const legendSpacingAbove = 12;
  const titleFontSize = 34;
  const titlePadding = 24;
  const titleSpacingBelow = 12;
  const fontFamily = "'Hiragino Maru Gothic Pro', 'Yu Gothic', 'Noto Sans JP', sans-serif";

  const entriesByLocation = new Map<string, Entry[]>();
  entries.forEach((entry) => {
    const list = entriesByLocation.get(entry.locationId) ?? [];
    list.push(entry);
    entriesByLocation.set(entry.locationId, list);
  });

  const orderIndexByEntry = new Map<string, number>();
  entriesByLocation.forEach((locationEntries) => {
    locationEntries.forEach((entry, index) => {
      orderIndexByEntry.set(entry.id, index);
    });
  });

  const columnMaxCounts = Array(colCount).fill(0);
  BOARD_STRUCTURE.forEach((row) => {
    row.forEach((location) => {
      const count = entriesByLocation.get(location.id)?.length ?? 0;
      columnMaxCounts[location.columnIndex] = Math.max(columnMaxCounts[location.columnIndex], count);
    });
  });

  const maxColumnCount = Math.max(...columnMaxCounts);
  const columnContentWidth = maxColumnCount > 0 ? baseWidth + (maxColumnCount - 1) * cardSpacing : baseWidth;
  const columnWidths = Array(colCount).fill(columnContentWidth);
  const columnStarts = [0, columnWidths[0]];
  const canvasWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const boardHeight = rowHeight * rowCount;
  const trimmedTitle = boardTitle.trim();
  const hasTitle = trimmedTitle.length > 0;
  const titleAreaHeight = hasTitle ? titleFontSize + titlePadding * 2 : 0;
  const boardTop = hasTitle ? titleAreaHeight + titleSpacingBelow : 0;
  const legendAreaHeight = legendFontSize + legendPadding * 2;
  const canvasHeight = boardTop + boardHeight + legendSpacingAbove + legendAreaHeight;
  const scale = Math.min(2, window.devicePixelRatio || 1);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (hasTitle) {
    ctx.font = `${fontWeight} ${titleFontSize}px ${fontFamily}`;
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleY = titlePadding + titleFontSize / 2;
    ctx.fillText(trimmedTitle, canvasWidth / 2, titleY);
  }

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#c4b89a';
  ctx.strokeRect(0.75, boardTop + 0.75, canvasWidth - 1.5, boardHeight - 1.5);

  for (let r = 1; r < rowCount; r += 1) {
    const y = boardTop + r * rowHeight + 0.75;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  const divisionX = columnWidths[0] + 0.75;
  ctx.beginPath();
  ctx.moveTo(divisionX, boardTop);
  ctx.lineTo(divisionX, boardTop + boardHeight);
  ctx.stroke();

  const baseTextFont = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.font = baseTextFont;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  entries.forEach((entry) => {
    const location = LOCATION_BY_ID[entry.locationId];
    if (!location) return;
    const orderIndex = orderIndexByEntry.get(entry.id) ?? 0;
    const rowStart = boardTop + location.rowIndex * rowHeight;
    const columnStart = columnStarts[location.columnIndex];
    const columnWidth = columnWidths[location.columnIndex];

    const isLeftColumn = location.columnIndex === 0;
    const direction = isLeftColumn ? 1 : -1;
    const xBase = isLeftColumn ? columnStart + padding : columnStart + columnWidth - padding;
    const x = xBase + direction * orderIndex * cardSpacing;
    const textColor = entry.owner === 'opponent' ? '#8b2500' : '#1a1a1a';
    ctx.fillStyle = textColor;

    const characters = Array.from(entry.formattedText);
    characters.forEach((char, idx) => {
      const y = rowStart + padding + idx * charSpacing;
      ctx.fillText(char, x, y);
    });
  });

  const legendY = boardTop + boardHeight + legendSpacingAbove + legendPadding;
  ctx.font = `400 ${legendFontSize}px ${fontFamily}`;
  ctx.fillStyle = '#5c5348';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(legendText, canvasWidth / 2, legendY);

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const dataUrl = canvas.toDataURL('image/png');
  const baseTitle = trimmedTitle || `karuta-layout-${timestamp}`;
  const sanitizedFileName = baseTitle.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '-');

  return {
    dataUrl,
    fileName: sanitizedFileName || `karuta-layout-${timestamp}`
  };
}

export function getDownloadInstructionMessage(): string {
  const coarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  if (coarsePointer) {
    return '画像を長押しして保存してください。PCでは右クリックで保存できます。';
  }
  return '画像を右クリックして保存してください。スマホでは長押しで保存できます。';
}
