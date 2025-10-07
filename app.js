const KIMARIJI_LIST = [
  'む', 'す', 'め', 'ふ', 'さ', 'ほ', 'せ', 'うか', 'うら', 'つき', 'つく', 'しら', 'しの', 'もも', 'もろ', 'ゆう', 'ゆら', 'いに',
  'いまは', 'いまこ', 'ちは', 'ちぎりき', 'ちぎりお', 'ひさ', 'ひとは', 'ひとも', 'きり', 'きみがためは', 'きみがためお', 'はるす',
  'はるの', 'はなさ', 'はなの', 'やえ', 'やす', 'やまが', 'やまざ', 'よも', 'よを', 'よのなかは', 'よのなかよ', 'かく', 'かさ',
  'かぜを', 'かぜそ', 'みち', 'みせ', 'みよ', 'みかき', 'みかの', 'たか', 'たち', 'たご', 'たま', 'たき', 'たれ', 'この', 'こぬ', 'こい',
  'これ', 'こころあ', 'こころに', 'おく', 'おと', 'おぐ', 'おも', 'おおえ', 'おおけ', 'おおこ', 'わび', 'わがい', 'わがそ', 'わすれ',
  'わすら', 'わたのはらや', 'わたのはらこ', 'なつ', 'なにし', 'なにわが', 'なにわえ', 'ながら', 'ながか', 'なげき', 'なげけ', 'あわじ',
  'あわれ', 'あらし', 'あらざ', 'あきの', 'あきか', 'あまつ', 'あまの', 'ありま', 'ありあ', 'あさじ', 'あさぼらけあ', 'あさぼらけう',
  'あい', 'あし', 'あけ'
];

const BOARD_STRUCTURE = [
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
];

const LOCATION_BY_ID = BOARD_STRUCTURE.flat().reduce((acc, location, index) => {
  acc[location.id] = {
    ...location,
    rowIndex: Math.floor(index / 2)
  };
  return acc;
}, {});

const state = {
  entries: [],
  dialogStep: 0,
  currentEntry: null
};

const elements = {};

const slotElements = new Map();

function init() {
  preventDoubleTapZoom();
  cacheElements();
  if (!validateEssentialElements()) {
    console.error('初期化に必要な要素が見つからなかったため、アプリを開始できません。');
    return;
  }

  state.currentEntry = createEmptyEntry();
  buildBoardStructure();
  buildLocationPicker();
  buildDecisionButtons();
  buildOwnerButtons();
  attachEventHandlers();
  renderBoard();
  renderRecordList();
  updateDownloadState();
}

function cacheElements() {
  elements.board = document.getElementById('board');
  elements.recordList = document.getElementById('record-list');
  elements.openDialogButton = document.getElementById('open-entry-dialog');
  elements.downloadButton = document.getElementById('download-board');
  elements.modal = document.getElementById('entry-dialog');
  elements.modalBackdrop = document.getElementById('dialog-backdrop');
  elements.closeDialogButton = document.getElementById('close-dialog');
  elements.nextButton = document.getElementById('next-step');
  elements.backButton = document.getElementById('back-step');
  elements.dialogSteps = Array.from(document.querySelectorAll('.dialog-step'));
  elements.kimarijiList = document.getElementById('kimariji-list');
  elements.locationPicker = document.getElementById('location-picker');
  elements.decisionButtons = document.getElementById('decision-buttons');
  elements.ownerButtons = document.getElementById('owner-buttons');
  elements.entrySummary = document.getElementById('entry-summary');
  elements.recordTemplate = document.getElementById('record-item-template');
}

function validateEssentialElements() {
  const essentials = [
    'board',
    'recordList',
    'openDialogButton',
    'downloadButton',
    'modal',
    'modalBackdrop',
    'closeDialogButton',
    'nextButton',
    'backButton',
    'kimarijiList',
    'locationPicker',
    'decisionButtons',
    'ownerButtons',
    'entrySummary',
    'recordTemplate'
  ];

  const missing = essentials.filter((key) => !elements[key]);
  const hasSteps = Array.isArray(elements.dialogSteps) && elements.dialogSteps.length > 0;

  return missing.length === 0 && hasSteps;
}

function createEmptyEntry() {
  return {
    kimariji: null,
    locationId: null,
    decisionNumber: null,
    owner: null
  };
}

function buildBoardStructure() {
  elements.board.innerHTML = '';
  slotElements.clear();

  BOARD_STRUCTURE.forEach((row) => {
    row.forEach((location) => {
      const slot = document.createElement('div');
      slot.className = 'board-slot';
      slot.dataset.locationId = location.id;
      slot.dataset.column = location.columnIndex === 0 ? 'left' : 'right';

      const slotItems = document.createElement('div');
      slotItems.className = 'slot-items';
      slot.appendChild(slotItems);

      elements.board.appendChild(slot);
      slotElements.set(location.id, slotItems);
    });
  });
}

function buildLocationPicker() {
  elements.locationPicker.innerHTML = '';
  BOARD_STRUCTURE.forEach((row) => {
    row.forEach((location) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'location-option';
      button.dataset.locationId = location.id;
      button.textContent = location.label;
      elements.locationPicker.appendChild(button);
    });
  });
}

function buildDecisionButtons() {
  elements.decisionButtons.innerHTML = '';
  for (let i = 1; i <= 6; i += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-chip';
    button.dataset.value = String(i);
    button.textContent = `${i}字`;
    elements.decisionButtons.appendChild(button);
  }
}

function buildOwnerButtons() {
  const options = [
    { value: 'opponent', label: '相手' },
    { value: 'self', label: '自分' }
  ];
  elements.ownerButtons.innerHTML = '';
  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-chip';
    button.dataset.value = option.value;
    button.textContent = option.label;
    elements.ownerButtons.appendChild(button);
  });
}

function attachEventHandlers() {
  elements.openDialogButton.addEventListener('click', openDialog);
  elements.closeDialogButton.addEventListener('click', closeDialog);
  elements.modalBackdrop.addEventListener('click', closeDialog);
  elements.nextButton.addEventListener('click', handleNextStep);
  elements.backButton.addEventListener('click', handleBackStep);
  elements.downloadButton.addEventListener('click', downloadBoardAsImage);

  elements.kimarijiList.addEventListener('click', handleKimarijiClick);
  elements.locationPicker.addEventListener('click', handleLocationClick);
  elements.decisionButtons.addEventListener('click', handleDecisionClick);
  elements.ownerButtons.addEventListener('click', handleOwnerClick);
  elements.recordList.addEventListener('click', handleRecordListClick);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.modal.classList.contains('hidden')) {
      closeDialog();
    }
  });
}

function preventDoubleTapZoom() {
  // Stop rapid consecutive taps from triggering zoom while leaving pinch zoom intact.
  let lastTouchTime = 0;
  document.addEventListener(
    'touchend',
    (event) => {
      if (event.changedTouches.length > 1) return;
      if (event.target instanceof HTMLElement) {
        const interactiveTag = event.target.closest('input, textarea, select');
        if (interactiveTag) return;
      }
      const now = Date.now();
      if (now - lastTouchTime < 350) {
        event.preventDefault();
      }
      lastTouchTime = now;
    },
    { passive: false }
  );
}

function openDialog() {
  state.currentEntry = createEmptyEntry();
  state.dialogStep = 0;
  renderKimarijiOptions();
  updateLocationSelection();
  updateDecisionSelection();
  updateOwnerSelection();
  updateSummary();
  setActiveStep(0);

  elements.modal.classList.remove('hidden');
  elements.modalBackdrop.classList.remove('hidden');
  document.body.classList.add('modal-open');
  const firstOption = elements.kimarijiList.querySelector('button');
  if (firstOption) {
    firstOption.focus();
  }
}

function closeDialog() {
  elements.modal.classList.add('hidden');
  elements.modalBackdrop.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function renderKimarijiOptions() {
  const used = new Set(state.entries.map((entry) => entry.kimariji));
  const fragment = document.createDocumentFragment();

  const candidates = KIMARIJI_LIST.filter((ki) => !used.has(ki));

  if (candidates.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'step-note';
    empty.textContent = '選択できる札がありません。削除すると再度選択できます。';
    fragment.appendChild(empty);
  } else {
    candidates.forEach((kimariji) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'kimariji-option';
      option.dataset.value = kimariji;
      option.textContent = kimariji;
      if (state.currentEntry.kimariji === kimariji) {
        option.classList.add('selected');
      }
      fragment.appendChild(option);
    });
  }

  elements.kimarijiList.innerHTML = '';
  elements.kimarijiList.appendChild(fragment);
  updateStepControls();
  maybeUpdateSummary();
}

function handleKimarijiClick(event) {
  if (!(event.target instanceof HTMLElement)) return;
  const { value } = event.target.dataset;
  if (!value) return;

  state.currentEntry.kimariji = value;
  renderKimarijiOptions();
}

function handleLocationClick(event) {
  if (!(event.target instanceof HTMLElement)) return;
  const { locationId } = event.target.dataset;
  if (!locationId) return;

  state.currentEntry.locationId = locationId;
  updateLocationSelection();
}

function updateLocationSelection() {
  Array.from(elements.locationPicker.children).forEach((button) => {
    const isSelected = button.dataset.locationId === state.currentEntry.locationId;
    button.classList.toggle('selected', isSelected);
  });
  updateStepControls();
  maybeUpdateSummary();
}

function handleDecisionClick(event) {
  if (!(event.target instanceof HTMLElement)) return;
  const { value } = event.target.dataset;
  if (!value) return;

  state.currentEntry.decisionNumber = Number(value);
  updateDecisionSelection();
}

function updateDecisionSelection() {
  Array.from(elements.decisionButtons.children).forEach((button) => {
    const isSelected = Number(button.dataset.value) === state.currentEntry.decisionNumber;
    button.classList.toggle('selected', isSelected);
  });
  updateStepControls();
  maybeUpdateSummary();
}

function handleOwnerClick(event) {
  if (!(event.target instanceof HTMLElement)) return;
  const { value } = event.target.dataset;
  if (!value) return;

  state.currentEntry.owner = value;
  updateOwnerSelection();
  updateSummary();
}

function updateOwnerSelection() {
  Array.from(elements.ownerButtons.children).forEach((button) => {
    const isSelected = button.dataset.value === state.currentEntry.owner;
    button.classList.toggle('selected', isSelected);
  });
  updateStepControls();
}

function handleRecordListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.action !== 'remove') return;

  const listItem = target.closest('.record-item');
  if (!listItem) return;
  const { entryId } = listItem.dataset;
  if (!entryId) return;

  state.entries = state.entries.filter((entry) => entry.id !== entryId);
  renderBoard();
  renderRecordList();
  updateDownloadState();
}

function handleNextStep() {
  if (!isCurrentStepComplete()) return;
  if (isFinalStep()) {
    saveEntry();
    return;
  }

  const nextStep = state.dialogStep + 1;
  setActiveStep(nextStep);
}

function handleBackStep() {
  const previous = Math.max(0, state.dialogStep - 1);
  setActiveStep(previous);
}

function setActiveStep(stepIndex) {
  state.dialogStep = stepIndex;
  elements.dialogSteps.forEach((step, index) => {
    step.classList.toggle('active', index === stepIndex);
  });
  updateStepControls();
  maybeUpdateSummary();
}

function updateStepControls() {
  const totalSteps = elements.dialogSteps.length;
  const onFinalStep = isFinalStep();
  elements.backButton.disabled = state.dialogStep === 0;
  elements.nextButton.textContent = onFinalStep ? '追加' : '次へ';
  elements.nextButton.disabled = !isCurrentStepComplete();
}

function isCurrentStepComplete() {
  switch (state.dialogStep) {
    case 0:
      return Boolean(state.currentEntry.kimariji);
    case 1:
      return Boolean(state.currentEntry.locationId);
    case 2:
      return Number.isInteger(state.currentEntry.decisionNumber);
    case 3:
      return Boolean(state.currentEntry.owner);
    default:
      return false;
  }
}

function maybeUpdateSummary() {
  if (state.dialogStep === elements.dialogSteps.length - 1) {
    updateSummary();
  }
}

function isFinalStep() {
  return state.dialogStep === elements.dialogSteps.length - 1;
}

function saveEntry() {
  if (!isCurrentStepComplete()) return;

  const formattedText = formatKimariji(state.currentEntry.kimariji, state.currentEntry.decisionNumber);
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `entry-${Date.now()}-${Math.random()}`,
    kimariji: state.currentEntry.kimariji,
    locationId: state.currentEntry.locationId,
    decisionNumber: state.currentEntry.decisionNumber,
    owner: state.currentEntry.owner,
    formattedText
  };

  state.entries.push(entry);
  closeDialog();
  renderBoard();
  renderRecordList();
  updateDownloadState();
}

function renderBoard() {
  slotElements.forEach((container) => {
    container.innerHTML = '';
  });

  state.entries.forEach((entry) => {
    const container = slotElements.get(entry.locationId);
    if (!container) return;
    const span = document.createElement('span');
    span.className = `card-text owner-${entry.owner}`;
    span.textContent = entry.formattedText;
    container.appendChild(span);
  });
}

function renderRecordList() {
  elements.recordList.innerHTML = '';

  if (state.entries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'record-item';
    empty.textContent = 'まだ札が登録されていません。';
    elements.recordList.appendChild(empty);
    return;
  }

  state.entries.forEach((entry) => {
    const clone = elements.recordTemplate.content.firstElementChild.cloneNode(true);
    clone.dataset.entryId = entry.id;

    const kimarijiEl = clone.querySelector('.record-kimariji');
    const metaEl = clone.querySelector('.record-meta');

    kimarijiEl.textContent = entry.formattedText;

    const locationLabel = LOCATION_BY_ID[entry.locationId]?.label ?? '';
    const ownerLabel = entry.owner === 'self' ? '自分' : '相手';
    const metaText = `${locationLabel} / ${ownerLabel} / ${entry.decisionNumber}字決まり`;
    metaEl.textContent = metaText;

    elements.recordList.appendChild(clone);
  });
}

function formatKimariji(kimariji, decisionNumber) {
  if (!kimariji) return '';
  if (!decisionNumber || decisionNumber >= kimariji.length) {
    return kimariji;
  }
  const leading = kimariji.slice(0, decisionNumber);
  const trailing = kimariji.slice(decisionNumber);
  return `${leading}︵${trailing}︶`;
}

function updateSummary() {
  const { kimariji, decisionNumber, locationId, owner } = state.currentEntry;
  const formatted = formatKimariji(kimariji, decisionNumber);
  const locationLabel = locationId ? LOCATION_BY_ID[locationId]?.label ?? '' : '未選択';
  const ownerLabel = owner === 'self' ? '自分' : owner === 'opponent' ? '相手' : '未選択';
  const decisionLabel = decisionNumber ? `${decisionNumber}字決まり` : '未入力';

  elements.entrySummary.innerHTML = '';
  const rows = [
    { title: '札', value: formatted || '未選択' },
    { title: '場所', value: locationLabel },
    { title: '何字', value: decisionLabel },
    { title: '取得者', value: ownerLabel }
  ];

  rows.forEach((row) => {
    const div = document.createElement('div');
    div.className = 'summary-row';
    const strong = document.createElement('strong');
    strong.textContent = row.title;
    div.appendChild(strong);
    div.append(row.value);
    elements.entrySummary.appendChild(div);
  });
}

function updateDownloadState() {
  elements.downloadButton.disabled = state.entries.length === 0;
}

function downloadBoardAsImage() {
  if (state.entries.length === 0) return;

  const rowCount = BOARD_STRUCTURE.length;
  const colCount = 2;
  const rowHeight = 180;
  const baseWidth = 180;
  const cardSpacing = 70;
  const padding = 24;
  const fontSize = 28;
  const charSpacing = 36;
  const fontWeight = '600';

  const entriesByLocation = new Map();
  state.entries.forEach((entry) => {
    if (!entriesByLocation.has(entry.locationId)) {
      entriesByLocation.set(entry.locationId, []);
    }
    entriesByLocation.get(entry.locationId).push(entry);
  });

  const orderIndexByEntry = new Map();
  entriesByLocation.forEach((entries) => {
    entries.forEach((entry, index) => {
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

  const columnWidths = columnMaxCounts.map((count) => (count > 0 ? baseWidth + (count - 1) * cardSpacing : baseWidth));
  const columnStarts = [0, columnWidths[0]];
  const canvasWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const canvasHeight = rowHeight * rowCount;
  const scale = Math.min(2, window.devicePixelRatio || 1);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#bfbfd0';
  ctx.strokeRect(0.75, 0.75, canvasWidth - 1.5, canvasHeight - 1.5);

  for (let r = 1; r < rowCount; r += 1) {
    const y = r * rowHeight + 0.75;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  const divisionX = columnWidths[0] + 0.75;
  ctx.beginPath();
  ctx.moveTo(divisionX, 0);
  ctx.lineTo(divisionX, canvasHeight);
  ctx.stroke();

  ctx.font = `${fontWeight} ${fontSize}px 'Rounded Mplus 1c', 'Yu Gothic', 'Noto Sans JP', sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  state.entries.forEach((entry) => {
    const location = LOCATION_BY_ID[entry.locationId];
    if (!location) return;
    const orderIndex = orderIndexByEntry.get(entry.id) ?? 0;
    const rowStart = location.rowIndex * rowHeight;
    const columnStart = columnStarts[location.columnIndex];
    const columnWidth = columnWidths[location.columnIndex];

    const isLeftColumn = location.columnIndex === 0;
    const direction = isLeftColumn ? 1 : -1;
    const xBase = isLeftColumn ? columnStart + padding : columnStart + columnWidth - padding;
    const x = xBase + direction * orderIndex * cardSpacing;
    const textColor = entry.owner === 'opponent' ? '#d62828' : '#1f1f27';
    ctx.fillStyle = textColor;

    const characters = Array.from(entry.formattedText);
    characters.forEach((char, idx) => {
      const y = rowStart + padding + idx * charSpacing;
      ctx.fillText(char, x, y);
    });
  });

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `karuta-layout-${timestamp}.png`;
  link.click();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .catch((error) => console.warn('Service worker registration failed:', error));
  });
}
