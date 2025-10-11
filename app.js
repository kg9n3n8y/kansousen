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

const STORAGE_KEY = 'kansousen-state-v1';

const state = {
  entries: [],
  dialogStep: 0,
  currentEntry: null,
  boardTitle: ''
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

  loadPersistedState();

  if (typeof state.boardTitle !== 'string') {
    state.boardTitle = '';
  }
  if (!state.boardTitle && typeof elements.boardTitleInput.value === 'string') {
    state.boardTitle = elements.boardTitleInput.value;
  }
  state.currentEntry = createEmptyEntry();
  elements.boardTitleInput.value = state.boardTitle;
  buildBoardStructure();
  buildLocationPicker();
  buildDecisionButtons();
  buildOwnerButtons();
  attachEventHandlers();
  renderBoard();
  updateBoardTitleDisplay();
  updateDownloadState();
}

function cacheElements() {
  elements.board = document.getElementById('board');
  elements.openDialogButton = document.getElementById('open-entry-dialog');
  elements.downloadButton = document.getElementById('download-board');
  elements.resetButton = document.getElementById('reset-board');
  elements.boardTitleInput = document.getElementById('board-title-input');
  elements.boardTitleDisplay = document.getElementById('board-title-display');
  elements.copyUrlButton = document.getElementById('copy-url');
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
  elements.resetDialog = document.getElementById('reset-confirm-dialog');
  elements.resetDialogBackdrop = document.getElementById('reset-dialog-backdrop');
  elements.confirmResetButton = document.getElementById('confirm-reset');
  elements.cancelResetButton = document.getElementById('cancel-reset');
}

function loadPersistedState() {
  if (!('localStorage' in window)) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return;

    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    state.entries = entries
      .map((entry) => {
        if (
          typeof entry !== 'object' ||
          entry === null ||
          typeof entry.id !== 'string' ||
          typeof entry.kimariji !== 'string' ||
          typeof entry.locationId !== 'string' ||
          typeof entry.owner !== 'string'
        ) {
          return null;
        }
        const decisionNumber = Number(entry.decisionNumber);
        if (!Number.isInteger(decisionNumber)) return null;
        return {
          id: entry.id,
          kimariji: entry.kimariji,
          locationId: entry.locationId,
          decisionNumber,
          owner: entry.owner,
          formattedText: formatKimariji(entry.kimariji, decisionNumber)
        };
      })
      .filter(Boolean);

    if (typeof parsed.boardTitle === 'string') {
      state.boardTitle = parsed.boardTitle;
    }
  } catch (error) {
    console.warn('保存されたデータの読み込みに失敗しました:', error);
  }
}

function persistState() {
  if (!('localStorage' in window)) return;
  try {
    const payload = {
      boardTitle: state.boardTitle,
      entries: state.entries.map((entry) => ({
        id: entry.id,
        kimariji: entry.kimariji,
        locationId: entry.locationId,
        decisionNumber: entry.decisionNumber,
        owner: entry.owner
      }))
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('状態の保存に失敗しました:', error);
  }
}

function clearPersistedState() {
  if (!('localStorage' in window)) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('状態の削除に失敗しました:', error);
  }
}

function validateEssentialElements() {
  const essentials = [
    'board',
    'openDialogButton',
    'downloadButton',
    'resetButton',
    'boardTitleInput',
    'boardTitleDisplay',
    'copyUrlButton',
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
    'resetDialog',
    'resetDialogBackdrop',
    'confirmResetButton',
    'cancelResetButton'
  ];

  const missing = essentials.filter((key) => !elements[key]);
  const hasSteps = Array.isArray(elements.dialogSteps) && elements.dialogSteps.length > 0;

  return missing.length === 0 && hasSteps;
}

function updateModalOpenState() {
  const hasEntryDialog = elements.modal && !elements.modal.classList.contains('hidden');
  const hasResetDialog = elements.resetDialog && !elements.resetDialog.classList.contains('hidden');
  document.body.classList.toggle('modal-open', hasEntryDialog || hasResetDialog);
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
    button.className = 'option-chip owner-option';
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
  elements.resetButton.addEventListener('click', openResetDialog);
  elements.copyUrlButton.addEventListener('click', handleCopyUrl);
  elements.resetDialogBackdrop.addEventListener('click', closeResetDialog);
  elements.cancelResetButton.addEventListener('click', closeResetDialog);
  elements.confirmResetButton.addEventListener('click', handleConfirmReset);
  elements.boardTitleInput.addEventListener('input', handleBoardTitleInput);

  elements.board.addEventListener('click', handleBoardClick);
  elements.board.addEventListener('keydown', handleBoardKeydown);
  elements.kimarijiList.addEventListener('click', handleKimarijiClick);
  elements.locationPicker.addEventListener('click', handleLocationClick);
  elements.decisionButtons.addEventListener('click', handleDecisionClick);
  elements.ownerButtons.addEventListener('click', handleOwnerClick);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!elements.modal.classList.contains('hidden')) {
      closeDialog();
      return;
    }
    if (!elements.resetDialog.classList.contains('hidden')) {
      closeResetDialog();
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

function handleBoardTitleInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  state.boardTitle = target.value;
  updateBoardTitleDisplay();
  persistState();
}

function updateBoardTitleDisplay() {
  const title = state.boardTitle.trim();
  elements.boardTitleDisplay.textContent = title;
  elements.boardTitleDisplay.classList.toggle('is-visible', title.length > 0);
}

function handleCopyUrl() {
  const button = elements.copyUrlButton;
  if (!button) return;
  const originalLabel = button.textContent;
  const url = 'https://kg9n3n8y.github.io/kansousen/';

  const showFeedback = (message, disable = true) => {
    button.textContent = message;
    if (disable) {
      button.disabled = true;
    }
    window.setTimeout(() => {
      button.textContent = originalLabel;
      button.disabled = false;
    }, 1500);
  };

  const fallbackCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (error) {
      success = false;
    }
    document.body.removeChild(textarea);
    if (success) {
      showFeedback('コピーしました');
    } else {
      showFeedback('コピーに失敗しました', false);
    }
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showFeedback('コピーしました');
      })
      .catch(() => {
        fallbackCopy();
      });
  } else {
    fallbackCopy();
  }
}

function handleBoardClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const card = target.closest('.card-text');
  if (!card) return;
  const { entryId } = card.dataset;
  if (!entryId) return;
  confirmAndRemoveEntry(entryId);
}

function handleBoardKeydown(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains('card-text')) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  const { entryId } = target.dataset;
  if (!entryId) return;
  confirmAndRemoveEntry(entryId);
}

function confirmAndRemoveEntry(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return;
  const ownerLabel = entry.owner === 'self' ? '自分' : '相手';
  const confirmed = window.confirm(`「${entry.formattedText}」（${ownerLabel}の札）を削除しますか？`);
  if (!confirmed) return;

  state.entries = state.entries.filter((item) => item.id !== entryId);
  renderBoard();
  updateDownloadState();
  persistState();
  if (!elements.modal.classList.contains('hidden')) {
    renderKimarijiOptions();
    updateLocationSelection();
    updateDecisionSelection();
    updateOwnerSelection();
    updateSummary();
  }
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
  updateModalOpenState();
  const firstOption = elements.kimarijiList.querySelector('button');
  if (firstOption) {
    firstOption.focus();
  }
}

function closeDialog() {
  elements.modal.classList.add('hidden');
  elements.modalBackdrop.classList.add('hidden');
  updateModalOpenState();
}

function openResetDialog() {
  elements.resetDialog.classList.remove('hidden');
  elements.resetDialogBackdrop.classList.remove('hidden');
  updateModalOpenState();
  elements.confirmResetButton.focus();
}

function closeResetDialog() {
  elements.resetDialog.classList.add('hidden');
  elements.resetDialogBackdrop.classList.add('hidden');
  updateModalOpenState();
}

function handleConfirmReset() {
  state.entries = [];
  state.boardTitle = '';
  elements.boardTitleInput.value = '';
  state.currentEntry = createEmptyEntry();
  renderBoard();
  updateBoardTitleDisplay();
  updateDownloadState();
  clearPersistedState();
  if (!elements.modal.classList.contains('hidden')) {
    renderKimarijiOptions();
    updateLocationSelection();
    updateDecisionSelection();
    updateOwnerSelection();
    updateSummary();
  }
  closeResetDialog();
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

  if (state.currentEntry.kimariji === value) {
    autoAdvanceAfterSelection(0);
    return;
  }
  state.currentEntry.kimariji = value;
  renderKimarijiOptions();
  autoAdvanceAfterSelection(0);
}

function handleLocationClick(event) {
  if (!(event.target instanceof HTMLElement)) return;
  const { locationId } = event.target.dataset;
  if (!locationId) return;

  if (state.currentEntry.locationId === locationId) {
    autoAdvanceAfterSelection(1);
    return;
  }
  state.currentEntry.locationId = locationId;
  updateLocationSelection();
  autoAdvanceAfterSelection(1);
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

  const decisionNumber = Number(value);
  if (state.currentEntry.decisionNumber === decisionNumber) {
    autoAdvanceAfterSelection(2);
    return;
  }
  state.currentEntry.decisionNumber = decisionNumber;
  updateDecisionSelection();
  autoAdvanceAfterSelection(2);
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
  const button = event.target.closest('button');
  if (!button) return;
  const { value } = button.dataset;
  if (!value) return;

  state.currentEntry.owner = value;
  updateOwnerSelection();
  updateSummary();
  if (isFinalStep() && isCurrentStepComplete()) {
    saveEntry();
  }
}

function updateOwnerSelection() {
  Array.from(elements.ownerButtons.children).forEach((button) => {
    const isSelected = button.dataset.value === state.currentEntry.owner;
    button.classList.toggle('selected', isSelected);
  });
  updateStepControls();
}

function handleNextStep() {
  if (!isCurrentStepComplete()) return;
  if (isFinalStep()) {
    saveEntry();
    return;
  }

  const nextStep = state.dialogStep + 1;
  setActiveStep(nextStep);
  focusStepFirstElement(nextStep);
}

function handleBackStep() {
  const previous = Math.max(0, state.dialogStep - 1);
  setActiveStep(previous);
  focusStepFirstElement(previous);
}

function setActiveStep(stepIndex) {
  state.dialogStep = stepIndex;
  elements.dialogSteps.forEach((step, index) => {
    step.classList.toggle('active', index === stepIndex);
  });
  updateStepControls();
  maybeUpdateSummary();
}

function focusStepFirstElement(stepIndex) {
  const step = elements.dialogSteps?.[stepIndex];
  if (!step) return;
  const focusable = step.querySelector(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable instanceof HTMLElement) {
    focusable.focus();
  }
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

function autoAdvanceAfterSelection(stepIndex) {
  const finalIndex = elements.dialogSteps.length - 1;
  if (stepIndex >= finalIndex) return;
  if (state.dialogStep !== stepIndex) return;
  if (!isCurrentStepComplete()) return;
  const nextStep = stepIndex + 1;
  setActiveStep(nextStep);
  focusStepFirstElement(nextStep);
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
  updateDownloadState();
  persistState();
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
    span.dataset.entryId = entry.id;
    span.tabIndex = 0;
    span.setAttribute('role', 'button');
    const ownerLabel = entry.owner === 'self' ? '自分' : '相手';
    span.setAttribute('aria-label', `${ownerLabel}が取った札「${entry.formattedText}」を削除`);
    span.title = 'クリックすると削除できます';
    span.textContent = entry.formattedText;
    container.appendChild(span);
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
  const boardTitle = state.boardTitle.trim();
  const titleFontSize = 34;
  const titlePadding = 24;
  const titleSpacingBelow = 12;
  const fontFamily = "'Rounded Mplus 1c', 'Yu Gothic', 'Noto Sans JP', sans-serif";

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

  const maxColumnCount = Math.max(...columnMaxCounts);
  const columnContentWidth = maxColumnCount > 0 ? baseWidth + (maxColumnCount - 1) * cardSpacing : baseWidth;
  const columnWidths = Array(colCount).fill(columnContentWidth);
  const columnStarts = [0, columnWidths[0]];
  const canvasWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const boardHeight = rowHeight * rowCount;
  const hasTitle = boardTitle.length > 0;
  const titleAreaHeight = hasTitle ? titleFontSize + titlePadding * 2 : 0;
  const boardTop = hasTitle ? titleAreaHeight + titleSpacingBelow : 0;
  const legendAreaHeight = legendFontSize + legendPadding * 2;
  const canvasHeight = boardTop + boardHeight + legendSpacingAbove + legendAreaHeight;
  const scale = Math.min(2, window.devicePixelRatio || 1);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (hasTitle) {
    ctx.font = `${fontWeight} ${titleFontSize}px ${fontFamily}`;
    ctx.fillStyle = '#1f1f27';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleY = titlePadding + titleFontSize / 2;
    ctx.fillText(boardTitle, canvasWidth / 2, titleY);
  }

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#bfbfd0';
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

  state.entries.forEach((entry) => {
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
    const textColor = entry.owner === 'opponent' ? '#d62828' : '#1f1f27';
    ctx.fillStyle = textColor;

    const characters = Array.from(entry.formattedText);
    if (characters.length === 0) return;

    characters.forEach((char, idx) => {
      const y = rowStart + padding + idx * charSpacing;
      ctx.fillText(char, x, y);
    });
  });

  const legendY = boardTop + boardHeight + legendSpacingAbove + legendPadding;
  ctx.font = `400 ${legendFontSize}px ${fontFamily}`;
  ctx.fillStyle = '#5c5c6b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(legendText, canvasWidth / 2, legendY);

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const dataUrl = canvas.toDataURL('image/png');
  const windowTitle = boardTitle || `karuta-layout-${timestamp}`;
  const popup = window.open('', '_blank');

  if (popup && !popup.closed) {
    popup.document.open();
    popup.document.write(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${windowTitle}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root {
    color-scheme: light;
  }
  body {
    margin: 0;
    background: #f6f6fb;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Rounded Mplus 1c', 'Yu Gothic', 'Noto Sans JP', sans-serif;
  }
  main {
    padding: 24px;
    text-align: center;
  }
  img {
    max-width: 100%;
    height: auto;
    box-shadow: 0 12px 32px rgba(31, 31, 39, 0.12);
    border-radius: 16px;
  }
  p {
    margin-top: 16px;
    color: #5c5c6b;
  }
</style>
</head>
<body>
  <main>
    <img src="${dataUrl}" alt="ダウンロード用の盤面画像">
    <p>画像を長押しまたは右クリックして保存してください。</p>
  </main>
</body>
</html>`);
    popup.document.close();
  } else {
    alert('ポップアップがブロックされています。ブラウザの設定で許可するか、別タブでの表示を許可してから再度ダウンロードしてください。');
  }
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
