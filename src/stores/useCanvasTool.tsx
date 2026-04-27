'use client';

import { create } from 'zustand';

import { CanvasSymbolOption, defaultCanvasSymbolOptions } from '@/components/aside-panel/tool/canvasSymbols';
import { createAlphabetSymbolRenderer } from '@/components/aside-panel/tool/canvasSymbolRenderers';

export type CanvasPanelMode =
  | 'image-import'
  | 'symbol-brush'
  | 'background-brush'
  | 'eraser'
  | 'fill'
  | 'selection'
  | 'layers'
  | 'none';

export type CanvasToolAction =
  | 'activate'
  | 'save'
  | 'undo'
  | 'redo'
  | 'zoom-in'
  | 'zoom-out';

export type CanvasToolShortcut = {
  key: string;
  label: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
};

export type CanvasToolDefinition = {
  id: string;
  label: string;
  description: string;
  shortcut?: CanvasToolShortcut;
  cursor: string;
  panelMode: CanvasPanelMode;
  action: CanvasToolAction;
};

export const toolbarGroups: Array<{
  id: string;
  buttons: CanvasToolDefinition[];
}> = [
  {
    id: 'system',
    buttons: [
      {
        id: 'image-import',
        description: '이미지 파일을 불러옵니다.',
        shortcut: { key: 'i', label: 'I' },
        label: '불러오기',
        cursor: 'default',
        panelMode: 'image-import',
        action: 'activate',
      },
      {
        id: 'save-image',
        description: '현재 차트를 PNG 이미지로 저장합니다.',
        shortcut: { key: 's', label: 'Ctrl+S', ctrlKey: true },
        label: '저장',
        cursor: 'default',
        panelMode: 'none',
        action: 'save',
      },
    ],
  },
  {
    id: 'drawing',
    buttons: [
      {
        id: 'symbol-brush',
        description: '선택한 기호를 캔버스에 그립니다.',
        shortcut: { key: 'b', label: 'B' },
        label: '기호',
        cursor: 'crosshair',
        panelMode: 'symbol-brush',
        action: 'activate',
      },
      {
        id: 'background-brush',
        description: '셀 배경색을 칠합니다.',
        shortcut: { key: 'g', label: 'G' },
        label: '배색',
        cursor: 'cell',
        panelMode: 'background-brush',
        action: 'activate',
      },
      {
        id: 'eraser',
        description: '셀에 그려진 기호나 배경색을 지웁니다.',
        shortcut: { key: 'e', label: 'E' },
        label: '지우개',
        cursor: 'not-allowed',
        panelMode: 'eraser',
        action: 'activate',
      },
      // {
      //   id: 'selection',
      //   label: '선택',
      //   cursor: 'crosshair',
      //   panelMode: 'selection',
      //   action: 'activate',
      // },
      // {
      //   id: 'fill',
      //   label: '채우기',
      //   cursor: 'copy',
      //   panelMode: 'fill',
      //   action: 'activate',
      // },
      // {
      //   id: 'move',
      //   label: '이동',
      //   cursor: 'grab',
      //   panelMode: 'selection',
      //   action: 'activate',
      // },
    ],
  },
  {
    id: 'history',
    buttons: [
      {
        id: 'undo',
        description: '마지막 작업을 되돌립니다.',
        shortcut: { key: 'z', label: 'Ctrl+Z', ctrlKey: true },
        label: '뒤로',
        cursor: 'default',
        panelMode: 'none',
        action: 'undo',
      },
      {
        id: 'redo',
        description: '되돌린 작업을 다시 실행합니다.',
        shortcut: { key: 'z', label: 'Ctrl+Shift+Z', ctrlKey: true, shiftKey: true },
        label: '앞으로',
        cursor: 'default',
        panelMode: 'none',
        action: 'redo',
      },
      {
        id: 'zoom-in',
        description: '캔버스를 확대합니다.',
        shortcut: { key: '=', label: 'Ctrl++', ctrlKey: true },
        label: '+',
        cursor: 'zoom-in',
        panelMode: 'none',
        action: 'zoom-in',
      },
      {
        id: 'zoom-out',
        description: '캔버스를 축소합니다.',
        shortcut: { key: '-', label: 'Ctrl+-', ctrlKey: true },
        label: '-',
        cursor: 'zoom-out',
        panelMode: 'none',
        action: 'zoom-out',
      },
    ],
  },
];

type CanvasToolStore = {
  activeToolId: string;
  panelMode: CanvasPanelMode;
  cursor: string;
  zoom: number;
  saveRequestNonce: number;
  symbolInputMode: 'svg' | 'alphabet';
  customSymbols: CanvasSymbolOption[];
  alphabetSymbolDraft: string;
  symbolColor: string;
  backgroundColor: string;
  selectedSymbol: string;
  eraserMode: 'symbol' | 'background' | 'area' | 'all';
  fillMode: 'symbol' | 'background';
  selectionMode: 'rectangle' | 'freeform';
  isPortraitViewport: boolean;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  activateTool: (definition: CanvasToolDefinition) => void;
  requestSave: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoom: number) => void;
  setSymbolInputMode: (mode: 'svg' | 'alphabet') => void;
  setAlphabetSymbolDraft: (symbol: string) => void;
  addAlphabetSymbol: () => void;
  deleteCustomSymbol: (symbolId: string) => void;
  setSymbolColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setSelectedSymbol: (symbol: string) => void;
  setEraserMode: (mode: 'symbol' | 'background' | 'area' | 'all') => void;
  setFillMode: (mode: 'symbol' | 'background') => void;
  setSelectionMode: (mode: 'rectangle' | 'freeform') => void;
  setPortraitViewport: (isPortraitViewport: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  showLayersPanel: () => void;
};

export const useCanvasTool = create<CanvasToolStore>((set) => ({
  activeToolId: 'symbol-brush',
  panelMode: 'symbol-brush',
  cursor: 'crosshair',
  zoom: 1,
  saveRequestNonce: 0,
  symbolInputMode: 'svg',
  customSymbols: [],
  alphabetSymbolDraft: '',
  symbolColor: '#000000',
  backgroundColor: '#000000',
  selectedSymbol: defaultCanvasSymbolOptions[0].id,
  eraserMode: 'all',
  fillMode: 'background',
  selectionMode: 'rectangle',
  isPortraitViewport: false,
  isLeftPanelOpen: true,
  isRightPanelOpen: true,
  activateTool: (definition) =>
    set({
      activeToolId: definition.id,
      panelMode: definition.panelMode,
      cursor: definition.cursor,
    }),
  requestSave: () => set((state) => ({ saveRequestNonce: state.saveRequestNonce + 1 })),
  zoomIn: () => set((state) => ({ zoom: Math.min(6, Number((state.zoom + 0.2).toFixed(2))) })),
  zoomOut: () => set((state) => ({ zoom: Math.max(0.4, Number((state.zoom - 0.2).toFixed(2))) })),
  setZoom: (zoom) => set({ zoom }),
  setSymbolInputMode: (symbolInputMode) => set({ symbolInputMode }),
  setAlphabetSymbolDraft: (alphabetSymbolDraft) =>
    set({ alphabetSymbolDraft: alphabetSymbolDraft.replace(/[^a-z]/gi, '').slice(0, 3) }),
  addAlphabetSymbol: () =>
    set((state) => {
      const value = state.alphabetSymbolDraft.trim().replace(/[^a-z]/gi, '').slice(0, 3);

      if (!value) {
        return state;
      }

      const id = `alphabet-${value.toLowerCase()}`;
      const nextSymbol: CanvasSymbolOption = {
        id,
        label: value,
        kind: 'alphabet',
        spanColumns: 1,
        spanRows: 1,
        draw: createAlphabetSymbolRenderer(),
      };
      const alreadyExists = [...defaultCanvasSymbolOptions, ...state.customSymbols].some(
        (symbol) => symbol.id === id,
      );

      return {
        customSymbols: alreadyExists ? state.customSymbols : [...state.customSymbols, nextSymbol],
        selectedSymbol: id,
        symbolInputMode: 'alphabet',
        alphabetSymbolDraft: '',
      };
    }),
  deleteCustomSymbol: (symbolId) =>
    set((state) => ({
      customSymbols: state.customSymbols.filter((symbol) => symbol.id !== symbolId),
      selectedSymbol: state.selectedSymbol === symbolId ? defaultCanvasSymbolOptions[0].id : state.selectedSymbol,
    })),
  setSymbolColor: (symbolColor) => set({ symbolColor }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
  setEraserMode: (eraserMode) => set({ eraserMode }),
  setFillMode: (fillMode) => set({ fillMode }),
  setSelectionMode: (selectionMode) => set({ selectionMode }),
  setPortraitViewport: (isPortraitViewport) =>
    set((state) => ({
      isPortraitViewport,
      isLeftPanelOpen: isPortraitViewport ? false : state.isLeftPanelOpen,
      isRightPanelOpen: isPortraitViewport ? false : state.isRightPanelOpen,
    })),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  showLayersPanel: () => set({ panelMode: 'layers' }),
}));
