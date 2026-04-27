'use client';

import { create } from 'zustand';

import {
  CanvasSnapshot,
  CellSelection,
  DrawingCell,
  DrawingLayer,
  ImageLayer,
  Layer,
  PlacedSymbol,
  ResizeOrigin,
} from '@/types/canvas';

const blankCellColor = '#ffffff';
const baseCellSize = 24;

type SymbolPlacementInput = {
  symbolId: string;
  symbolText: string;
  spanRows: number;
  spanColumns: number;
  symbolColor: string;
};

type CanvasStore = CanvasSnapshot & {
  historyPast: CanvasSnapshot[];
  historyFuture: CanvasSnapshot[];
  selection: CellSelection | null;
  createCanvas: (rows: number, stiches: number) => void;
  resizeCanvas: (rows: number, stiches: number, origin: ResizeOrigin) => void;
  setResizeOrigin: (origin: ResizeOrigin) => void;
  setTitle: (title: string) => void;
  setCanvasBackgroundColor: (color: string) => void;
  setSelection: (selection: CellSelection | null) => void;
  clearSelection: () => void;
  paintSymbolCell: (row: number, column: number, symbol: SymbolPlacementInput) => void;
  paintBackgroundCell: (row: number, column: number, backgroundColor: string) => void;
  eraseCellSymbol: (row: number, column: number) => void;
  eraseCellBackground: (row: number, column: number) => void;
  clearCell: (row: number, column: number) => void;
  moveActiveDrawingLayer: (rowDelta: number, columnDelta: number) => void;
  moveActiveImageLayer: (offsetXDelta: number, offsetYDelta: number) => void;
  flipActiveLayerHorizontally: () => void;
  flipActiveLayerVertically: () => void;
  flipSelectionHorizontally: () => void;
  flipSelectionVertically: () => void;
  duplicateSelection: () => void;
  addDrawingLayer: () => void;
  addImageLayer: (payload: {
    name: string;
    src: string;
    thumbnail: string;
    imageWidth: number;
    imageHeight: number;
  }) => void;
  setActiveLayer: (layerId: string) => void;
  moveLayer: (sourceId: string, targetId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  renameLayer: (layerId: string, name: string) => void;
  clearDrawingLayer: (layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  mergeLayerDown: (layerId: string) => void;
  fitImageLayerToCanvas: (layerId: string) => void;
  setImageLayerSize: (layerId: string, width: number, height: number) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
};

let layerIdSequence = 0;
let placedSymbolIdSequence = 0;

function createLayerId() {
  layerIdSequence += 1;

  return `layer-${layerIdSequence}`;
}

function createPlacedSymbolId() {
  placedSymbolIdSequence += 1;

  return `symbol-${placedSymbolIdSequence}`;
}

function createBlankCell(): DrawingCell {
  return {
    backgroundColor: blankCellColor,
  };
}

function cloneCell(cell: DrawingCell): DrawingCell {
  return { ...cell };
}

function clonePlacedSymbol(symbol: PlacedSymbol): PlacedSymbol {
  return { ...symbol };
}

function cloneLayer(layer: Layer): Layer {
  if (layer.type === 'image') {
    return { ...layer };
  }

  return {
    ...layer,
    cells: layer.cells.map(cloneCell),
    placedSymbols: layer.placedSymbols.map(clonePlacedSymbol),
  };
}

function snapshotFromState(state: CanvasSnapshot): CanvasSnapshot {
  return {
    title: state.title,
    rows: state.rows,
    stiches: state.stiches,
    hasCanvas: state.hasCanvas,
    canvasBackgroundColor: state.canvasBackgroundColor,
    resizeOrigin: state.resizeOrigin,
    layers: state.layers.map(cloneLayer),
    activeLayerId: state.activeLayerId,
  };
}

function createDrawingLayer(stiches: number, rows: number, name: string): DrawingLayer {
  return {
    id: createLayerId(),
    type: 'drawing',
    name,
    visible: true,
    opacity: 1,
    cells: Array.from({ length: rows * stiches }, () => createBlankCell()),
    placedSymbols: [],
  };
}

function getContainedImageFrame(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    width,
    height,
    offsetX: (canvasWidth - width) / 2,
    offsetY: (canvasHeight - height) / 2,
  };
}

function getDrawingLayerIndex(layers: Layer[], layerId: string) {
  return layers.findIndex((layer) => layer.id === layerId && layer.type === 'drawing');
}

function getCellIndex(row: number, column: number, stiches: number) {
  return row * stiches + column;
}

function symbolOccupiesCell(symbol: PlacedSymbol, row: number, column: number) {
  return (
    row >= symbol.row &&
    row < symbol.row + symbol.spanRows &&
    column >= symbol.column &&
    column < symbol.column + symbol.spanColumns
  );
}

function symbolHasVisibleArea(symbol: PlacedSymbol, rows: number, stiches: number) {
  return (
    symbol.row < rows &&
    symbol.column < stiches &&
    symbol.row + symbol.spanRows > 0 &&
    symbol.column + symbol.spanColumns > 0
  );
}

function symbolsOverlap(
  firstRow: number,
  firstColumn: number,
  firstSpanRows: number,
  firstSpanColumns: number,
  second: PlacedSymbol,
) {
  return !(
    firstRow + firstSpanRows <= second.row ||
    second.row + second.spanRows <= firstRow ||
    firstColumn + firstSpanColumns <= second.column ||
    second.column + second.spanColumns <= firstColumn
  );
}

function getResizeOffsets(current: number, next: number, placement: 'start' | 'center' | 'end') {
  if (next >= current) {
    const growth = next - current;

    if (placement === 'start') {
      return { addBefore: growth, addAfter: 0, removeBefore: 0, removeAfter: 0 };
    }

    if (placement === 'end') {
      return { addBefore: 0, addAfter: growth, removeBefore: 0, removeAfter: 0 };
    }

    return {
      addBefore: Math.floor(growth / 2),
      addAfter: Math.ceil(growth / 2),
      removeBefore: 0,
      removeAfter: 0,
    };
  }

  const shrink = current - next;

  if (placement === 'start') {
    return { addBefore: 0, addAfter: 0, removeBefore: shrink, removeAfter: 0 };
  }

  if (placement === 'end') {
    return { addBefore: 0, addAfter: 0, removeBefore: 0, removeAfter: shrink };
  }

  return {
    addBefore: 0,
    addAfter: 0,
    removeBefore: Math.floor(shrink / 2),
    removeAfter: Math.ceil(shrink / 2),
  };
}

function normalizeSelection(selection: CellSelection) {
  return {
    top: Math.min(selection.top, selection.bottom),
    left: Math.min(selection.left, selection.right),
    bottom: Math.max(selection.top, selection.bottom),
    right: Math.max(selection.left, selection.right),
  };
}

function symbolIsInsideSelection(symbol: PlacedSymbol, selection: CellSelection) {
  return (
    symbol.row >= selection.top &&
    symbol.column >= selection.left &&
    symbol.row + symbol.spanRows - 1 <= selection.bottom &&
    symbol.column + symbol.spanColumns - 1 <= selection.right
  );
}

function moveDrawingLayerContent(
  layer: DrawingLayer,
  rows: number,
  stiches: number,
  rowDelta: number,
  columnDelta: number,
) {
  if (rowDelta === 0 && columnDelta === 0) {
    return layer;
  }

  const nextCells = Array.from({ length: rows * stiches }, () => createBlankCell());

  for (let sourceRow = 0; sourceRow < rows; sourceRow += 1) {
    for (let sourceColumn = 0; sourceColumn < stiches; sourceColumn += 1) {
      const nextRow = sourceRow + rowDelta;
      const nextColumn = sourceColumn + columnDelta;

      if (nextRow < 0 || nextRow >= rows || nextColumn < 0 || nextColumn >= stiches) {
        continue;
      }

      nextCells[getCellIndex(nextRow, nextColumn, stiches)] =
        cloneCell(layer.cells[getCellIndex(sourceRow, sourceColumn, stiches)] ?? createBlankCell());
    }
  }

  return {
    ...layer,
    cells: nextCells,
    placedSymbols: layer.placedSymbols
      .map((symbol) => ({
        ...symbol,
        row: symbol.row + rowDelta,
        column: symbol.column + columnDelta,
      }))
      .filter((symbol) => symbolHasVisibleArea(symbol, rows, stiches)),
  };
}

function createInitialSnapshot(): CanvasSnapshot {
  const stiches = 24;
  const rows = 32;
  const initialLayer = createDrawingLayer(stiches, rows, '레이어 1');

  return {
    title: '새 차트',
    rows,
    stiches,
    hasCanvas: true,
    canvasBackgroundColor: '#ffffff',
    resizeOrigin: 'center',
    layers: [initialLayer],
    activeLayerId: initialLayer.id,
  };
}

function commitSnapshot(
  state: CanvasStore,
  nextSnapshot: CanvasSnapshot,
  selection: CellSelection | null = state.selection,
) {
  return {
    ...snapshotFromState(nextSnapshot),
    historyPast: [...state.historyPast, snapshotFromState(state)],
    historyFuture: [],
    selection,
  };
}

function updateDrawingLayer(
  state: CanvasStore,
  updater: (layer: DrawingLayer) => DrawingLayer,
  selection: CellSelection | null = state.selection,
) {
  const layerIndex = state.activeLayerId ? getDrawingLayerIndex(state.layers, state.activeLayerId) : -1;

  if (layerIndex < 0) {
    return state;
  }

  const currentLayer = state.layers[layerIndex] as DrawingLayer;
  const nextLayer = updater(currentLayer);

  if (nextLayer === currentLayer) {
    return state;
  }

  return commitSnapshot(
    state,
    {
      title: state.title,
      rows: state.rows,
      stiches: state.stiches,
      hasCanvas: state.hasCanvas,
      canvasBackgroundColor: state.canvasBackgroundColor,
      resizeOrigin: state.resizeOrigin,
      layers: state.layers.map((layer, index) => (index === layerIndex ? nextLayer : layer)),
      activeLayerId: state.activeLayerId,
    },
    selection,
  );
}

const initialSnapshot = createInitialSnapshot();

export { blankCellColor };
export type {
  CanvasStore,
  CellSelection,
  DrawingCell,
  DrawingLayer,
  ImageLayer,
  Layer,
  PlacedSymbol,
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  ...initialSnapshot,
  historyPast: [],
  historyFuture: [],
  selection: null,
  createCanvas: (rows, stiches) =>
    set((state) => {
      const drawingLayer = createDrawingLayer(stiches, rows, '레이어 1');

      return commitSnapshot(
        state,
        {
          title: state.title,
          rows,
          stiches,
          hasCanvas: true,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: 'center',
          layers: [drawingLayer],
          activeLayerId: drawingLayer.id,
        },
        null,
      );
    }),
  resizeCanvas: (rows, stiches, origin) =>
    set((state) => {
      const verticalPlacement = origin.includes('top')
        ? 'end'
        : origin.includes('bottom')
          ? 'start'
          : 'center';
      const horizontalPlacement = origin.includes('left')
        ? 'end'
        : origin.includes('right')
          ? 'start'
          : 'center';
      const rowOffsets = getResizeOffsets(state.rows, rows, verticalPlacement);
      const columnOffsets = getResizeOffsets(state.stiches, stiches, horizontalPlacement);
      const horizontalShift = columnOffsets.addBefore - columnOffsets.removeBefore;
      const verticalShift = rowOffsets.addBefore - rowOffsets.removeBefore;

      return commitSnapshot(
        state,
        {
          title: state.title,
          rows,
          stiches,
          hasCanvas: true,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: origin,
          activeLayerId: state.activeLayerId,
          layers: state.layers.map((layer) => {
            if (layer.type === 'image') {
              return {
                ...layer,
                offsetX: layer.offsetX + horizontalShift * baseCellSize,
                offsetY: layer.offsetY + verticalShift * baseCellSize,
              };
            }

            const resizedCells = Array.from({ length: rows * stiches }, () => createBlankCell());

            for (let sourceRow = 0; sourceRow < state.rows; sourceRow += 1) {
              for (let sourceColumn = 0; sourceColumn < state.stiches; sourceColumn += 1) {
                const nextRow = sourceRow + verticalShift;
                const nextColumn = sourceColumn + horizontalShift;

                if (nextRow < 0 || nextRow >= rows || nextColumn < 0 || nextColumn >= stiches) {
                  continue;
                }

                resizedCells[getCellIndex(nextRow, nextColumn, stiches)] =
                  layer.cells[getCellIndex(sourceRow, sourceColumn, state.stiches)] ?? createBlankCell();
              }
            }

            return {
              ...layer,
              cells: resizedCells,
              placedSymbols: layer.placedSymbols
                .map((symbol) => ({
                  ...symbol,
                  row: symbol.row + verticalShift,
                  column: symbol.column + horizontalShift,
                }))
                .filter((symbol) => symbolHasVisibleArea(symbol, rows, stiches)),
            };
          }),
        },
        null,
      );
    }),
  setResizeOrigin: (origin) => set({ resizeOrigin: origin }),
  setTitle: (title) => set({ title }),
  setCanvasBackgroundColor: (canvasBackgroundColor) => set({ canvasBackgroundColor }),
  setSelection: (selection) => set({ selection: selection ? normalizeSelection(selection) : null }),
  clearSelection: () => set({ selection: null }),
  paintSymbolCell: (row, column, symbol) =>
    set((state) =>
      updateDrawingLayer(state, (layer) => ({
        ...layer,
        placedSymbols: [
          ...layer.placedSymbols.filter(
            (placedSymbol) =>
              !symbolsOverlap(row, column, symbol.spanRows, symbol.spanColumns, placedSymbol),
          ),
          {
            id: createPlacedSymbolId(),
            symbolId: symbol.symbolId,
            symbolText: symbol.symbolText,
            symbolColor: symbol.symbolColor,
            row,
            column,
            spanRows: symbol.spanRows,
            spanColumns: symbol.spanColumns,
          },
        ],
      })),
    ),
  paintBackgroundCell: (row, column, backgroundColor) =>
    set((state) =>
      updateDrawingLayer(state, (layer) => {
        const index = getCellIndex(row, column, state.stiches);
        const currentCell = layer.cells[index];

        if (!currentCell || currentCell.backgroundColor === backgroundColor) {
          return layer;
        }

        return {
          ...layer,
          cells: layer.cells.map((cell, cellIndex) =>
            cellIndex === index ? { backgroundColor } : cell,
          ),
        };
      }),
    ),
  eraseCellSymbol: (row, column) =>
    set((state) =>
      updateDrawingLayer(state, (layer) => {
        const nextPlacedSymbols = layer.placedSymbols.filter(
          (symbol) => !symbolOccupiesCell(symbol, row, column),
        );

        if (nextPlacedSymbols.length === layer.placedSymbols.length) {
          return layer;
        }

        return {
          ...layer,
          placedSymbols: nextPlacedSymbols,
        };
      }),
    ),
  eraseCellBackground: (row, column) =>
    set((state) =>
      updateDrawingLayer(state, (layer) => {
        const index = getCellIndex(row, column, state.stiches);
        const currentCell = layer.cells[index];

        if (!currentCell || currentCell.backgroundColor === blankCellColor) {
          return layer;
        }

        return {
          ...layer,
          cells: layer.cells.map((cell, cellIndex) =>
            cellIndex === index ? createBlankCell() : cell,
          ),
        };
      }),
    ),
  clearCell: (row, column) =>
    set((state) =>
      updateDrawingLayer(state, (layer) => {
        const occupiedSymbol = layer.placedSymbols.find((symbol) => symbolOccupiesCell(symbol, row, column));
        let nextCells = layer.cells;

        if (occupiedSymbol) {
          const visibleStartRow = Math.max(0, occupiedSymbol.row);
          const visibleEndRow = Math.min(state.rows, occupiedSymbol.row + occupiedSymbol.spanRows);
          const visibleStartColumn = Math.max(0, occupiedSymbol.column);
          const visibleEndColumn = Math.min(state.stiches, occupiedSymbol.column + occupiedSymbol.spanColumns);
          const clearedIndexes = new Set<number>();

          for (let currentRow = visibleStartRow; currentRow < visibleEndRow; currentRow += 1) {
            for (let currentColumn = visibleStartColumn; currentColumn < visibleEndColumn; currentColumn += 1) {
              clearedIndexes.add(getCellIndex(currentRow, currentColumn, state.stiches));
            }
          }

          nextCells = layer.cells.map((cell, cellIndex) =>
            clearedIndexes.has(cellIndex) ? createBlankCell() : cell,
          );
        } else {
          const index = getCellIndex(row, column, state.stiches);
          nextCells = layer.cells.map((cell, cellIndex) =>
            cellIndex === index ? createBlankCell() : cell,
          );
        }

        const nextPlacedSymbols = layer.placedSymbols.filter(
          (symbol) => !symbolOccupiesCell(symbol, row, column),
        );

        if (nextCells === layer.cells && nextPlacedSymbols.length === layer.placedSymbols.length) {
          return layer;
        }

        return {
          ...layer,
          cells: nextCells,
          placedSymbols: nextPlacedSymbols,
        };
      }),
    ),
  moveActiveDrawingLayer: (rowDelta, columnDelta) =>
    set((state) =>
      updateDrawingLayer(state, (layer) =>
        moveDrawingLayerContent(layer, state.rows, state.stiches, rowDelta, columnDelta),
      ),
    ),
  moveActiveImageLayer: (offsetXDelta, offsetYDelta) =>
    set((state) => {
      if (!state.activeLayerId || (offsetXDelta === 0 && offsetYDelta === 0)) {
        return state;
      }

      const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId);

      if (!activeLayer || activeLayer.type !== 'image') {
        return state;
      }

      return commitSnapshot(state, {
        title: state.title,
        rows: state.rows,
        stiches: state.stiches,
        hasCanvas: state.hasCanvas,
        canvasBackgroundColor: state.canvasBackgroundColor,
        resizeOrigin: state.resizeOrigin,
        activeLayerId: state.activeLayerId,
        layers: state.layers.map((layer) =>
          layer.id === activeLayer.id && layer.type === 'image'
            ? {
                ...layer,
                offsetX: layer.offsetX + offsetXDelta,
                offsetY: layer.offsetY + offsetYDelta,
              }
            : layer,
        ),
      });
    }),
  flipActiveLayerHorizontally: () =>
    set((state) => {
      const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId);

      if (!activeLayer) {
        return state;
      }

      if (activeLayer.type === 'image') {
        return commitSnapshot(state, {
          title: state.title,
          rows: state.rows,
          stiches: state.stiches,
          hasCanvas: state.hasCanvas,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: state.resizeOrigin,
          activeLayerId: state.activeLayerId,
          layers: state.layers.map((layer) =>
            layer.id === activeLayer.id && layer.type === 'image'
              ? { ...layer, isFlippedHorizontally: !layer.isFlippedHorizontally }
              : layer,
          ),
        });
      }

      return updateDrawingLayer(state, (layer) => {
        const nextCells = Array.from({ length: state.rows * state.stiches }, () => createBlankCell());

        for (let row = 0; row < state.rows; row += 1) {
          for (let column = 0; column < state.stiches; column += 1) {
            nextCells[getCellIndex(row, state.stiches - column - 1, state.stiches)] =
              cloneCell(layer.cells[getCellIndex(row, column, state.stiches)] ?? createBlankCell());
          }
        }

        return {
          ...layer,
          cells: nextCells,
          placedSymbols: layer.placedSymbols.map((symbol) => ({
            ...symbol,
            column: state.stiches - symbol.column - symbol.spanColumns,
          })),
        };
      });
    }),
  flipActiveLayerVertically: () =>
    set((state) => {
      const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId);

      if (!activeLayer) {
        return state;
      }

      if (activeLayer.type === 'image') {
        return commitSnapshot(state, {
          title: state.title,
          rows: state.rows,
          stiches: state.stiches,
          hasCanvas: state.hasCanvas,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: state.resizeOrigin,
          activeLayerId: state.activeLayerId,
          layers: state.layers.map((layer) =>
            layer.id === activeLayer.id && layer.type === 'image'
              ? { ...layer, isFlippedVertically: !layer.isFlippedVertically }
              : layer,
          ),
        });
      }

      return updateDrawingLayer(state, (layer) => {
        const nextCells = Array.from({ length: state.rows * state.stiches }, () => createBlankCell());

        for (let row = 0; row < state.rows; row += 1) {
          for (let column = 0; column < state.stiches; column += 1) {
            nextCells[getCellIndex(state.rows - row - 1, column, state.stiches)] =
              cloneCell(layer.cells[getCellIndex(row, column, state.stiches)] ?? createBlankCell());
          }
        }

        return {
          ...layer,
          cells: nextCells,
          placedSymbols: layer.placedSymbols.map((symbol) => ({
            ...symbol,
            row: state.rows - symbol.row - symbol.spanRows,
          })),
        };
      });
    }),
  flipSelectionHorizontally: () =>
    set((state) => {
      if (!state.selection) {
        return state;
      }

      const selection = normalizeSelection(state.selection);

      return updateDrawingLayer(
        state,
        (layer) => {
          const nextCells = layer.cells.map(cloneCell);

          for (let row = selection.top; row <= selection.bottom; row += 1) {
            for (let column = selection.left; column <= selection.right; column += 1) {
              const mirroredColumn = selection.left + (selection.right - column);

              nextCells[getCellIndex(row, mirroredColumn, state.stiches)] = cloneCell(
                layer.cells[getCellIndex(row, column, state.stiches)] ?? createBlankCell(),
              );
            }
          }

          const selectedSymbols = layer.placedSymbols.filter((symbol) => symbolIsInsideSelection(symbol, selection));
          const mirroredSymbols = selectedSymbols.map((symbol) => ({
            ...symbol,
            column: selection.left + (selection.right - (symbol.column + symbol.spanColumns - 1)),
          }));

          return {
            ...layer,
            cells: nextCells,
            placedSymbols: [
              ...layer.placedSymbols.filter(
                (symbol) =>
                  !selectedSymbols.includes(symbol) &&
                  !mirroredSymbols.some((mirroredSymbol) =>
                    symbolsOverlap(
                      mirroredSymbol.row,
                      mirroredSymbol.column,
                      mirroredSymbol.spanRows,
                      mirroredSymbol.spanColumns,
                      symbol,
                    ),
                  ),
              ),
              ...mirroredSymbols,
            ],
          };
        },
        selection,
      );
    }),
  flipSelectionVertically: () =>
    set((state) => {
      if (!state.selection) {
        return state;
      }

      const selection = normalizeSelection(state.selection);

      return updateDrawingLayer(
        state,
        (layer) => {
          const nextCells = layer.cells.map(cloneCell);

          for (let row = selection.top; row <= selection.bottom; row += 1) {
            for (let column = selection.left; column <= selection.right; column += 1) {
              const mirroredRow = selection.top + (selection.bottom - row);

              nextCells[getCellIndex(mirroredRow, column, state.stiches)] = cloneCell(
                layer.cells[getCellIndex(row, column, state.stiches)] ?? createBlankCell(),
              );
            }
          }

          const selectedSymbols = layer.placedSymbols.filter((symbol) => symbolIsInsideSelection(symbol, selection));
          const mirroredSymbols = selectedSymbols.map((symbol) => ({
            ...symbol,
            row: selection.top + (selection.bottom - (symbol.row + symbol.spanRows - 1)),
          }));

          return {
            ...layer,
            cells: nextCells,
            placedSymbols: [
              ...layer.placedSymbols.filter(
                (symbol) =>
                  !selectedSymbols.includes(symbol) &&
                  !mirroredSymbols.some((mirroredSymbol) =>
                    symbolsOverlap(
                      mirroredSymbol.row,
                      mirroredSymbol.column,
                      mirroredSymbol.spanRows,
                      mirroredSymbol.spanColumns,
                      symbol,
                    ),
                  ),
              ),
              ...mirroredSymbols,
            ],
          };
        },
        selection,
      );
    }),
  duplicateSelection: () =>
    set((state) => {
      if (!state.selection) {
        return state;
      }

      const selection = normalizeSelection(state.selection);
      const activeLayerIndex = state.activeLayerId ? getDrawingLayerIndex(state.layers, state.activeLayerId) : -1;

      if (activeLayerIndex < 0) {
        return state;
      }

      const activeLayer = state.layers[activeLayerIndex] as DrawingLayer;
      const duplicatedLayer: DrawingLayer = {
        ...createDrawingLayer(
          state.stiches,
          state.rows,
          `${activeLayer.name} 선택 복사본`,
        ),
        cells: Array.from({ length: state.rows * state.stiches }, (_, index) => {
          const row = Math.floor(index / state.stiches);
          const column = index % state.stiches;

          if (
            row < selection.top ||
            row > selection.bottom ||
            column < selection.left ||
            column > selection.right
          ) {
            return createBlankCell();
          }

          return cloneCell(activeLayer.cells[index] ?? createBlankCell());
        }),
        placedSymbols: activeLayer.placedSymbols
          .filter((symbol) => symbolIsInsideSelection(symbol, selection))
          .map((symbol) => ({
            ...clonePlacedSymbol(symbol),
            id: createPlacedSymbolId(),
          })),
      };

      const nextLayers = [...state.layers];
      nextLayers.splice(activeLayerIndex + 1, 0, duplicatedLayer);

      return commitSnapshot(
        state,
        {
          title: state.title,
          rows: state.rows,
          stiches: state.stiches,
          hasCanvas: state.hasCanvas,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: state.resizeOrigin,
          layers: nextLayers,
          activeLayerId: duplicatedLayer.id,
        },
        selection,
      );
    }),
  addDrawingLayer: () =>
    set((state) => {
      const drawingLayer = createDrawingLayer(
        state.stiches,
        state.rows,
        `레이어 ${state.layers.filter((layer) => layer.type === 'drawing').length + 1}`,
      );

      return commitSnapshot(
        state,
        {
          title: state.title,
          rows: state.rows,
          stiches: state.stiches,
          hasCanvas: state.hasCanvas,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: state.resizeOrigin,
          activeLayerId: drawingLayer.id,
          layers: [...state.layers, drawingLayer],
        },
        null,
      );
    }),
  addImageLayer: ({ name, src, thumbnail, imageWidth, imageHeight }) =>
    set((state) => {
      const canvasWidth = state.stiches * baseCellSize;
      const canvasHeight = state.rows * baseCellSize;
      const imageFrame = getContainedImageFrame(imageWidth, imageHeight, canvasWidth, canvasHeight);
      const imageLayer: ImageLayer = {
        id: createLayerId(),
        type: 'image',
        name,
        visible: true,
        opacity: 1,
        src,
        thumbnail,
        imageWidth,
        imageHeight,
        width: imageFrame.width,
        height: imageFrame.height,
        offsetX: imageFrame.offsetX,
        offsetY: imageFrame.offsetY,
        isFlippedHorizontally: false,
        isFlippedVertically: false,
      };

      return commitSnapshot(
        state,
        {
          title: state.title,
          rows: state.rows,
          stiches: state.stiches,
          hasCanvas: state.hasCanvas,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: state.resizeOrigin,
          activeLayerId: imageLayer.id,
          layers: [...state.layers, imageLayer],
        },
        null,
      );
    }),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId, selection: null }),
  moveLayer: (sourceId, targetId) =>
    set((state) => {
      if (sourceId === targetId) {
        return state;
      }

      const sourceIndex = state.layers.findIndex((layer) => layer.id === sourceId);
      const targetIndex = state.layers.findIndex((layer) => layer.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return state;
      }

      const nextLayers = [...state.layers];
      const [sourceLayer] = nextLayers.splice(sourceIndex, 1);
      nextLayers.splice(targetIndex, 0, sourceLayer);

      return commitSnapshot(state, {
        title: state.title,
        rows: state.rows,
        stiches: state.stiches,
        hasCanvas: state.hasCanvas,
        canvasBackgroundColor: state.canvasBackgroundColor,
        resizeOrigin: state.resizeOrigin,
        activeLayerId: state.activeLayerId,
        layers: nextLayers,
      });
    }),
  toggleLayerVisibility: (layerId) =>
    set((state) =>
      commitSnapshot(state, {
        title: state.title,
        rows: state.rows,
        stiches: state.stiches,
        hasCanvas: state.hasCanvas,
        canvasBackgroundColor: state.canvasBackgroundColor,
        resizeOrigin: state.resizeOrigin,
        activeLayerId: state.activeLayerId,
        layers: state.layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
        ),
      }),
    ),
  setLayerOpacity: (layerId, opacity) =>
    set((state) =>
      commitSnapshot(state, {
        title: state.title,
        rows: state.rows,
        stiches: state.stiches,
        hasCanvas: state.hasCanvas,
        canvasBackgroundColor: state.canvasBackgroundColor,
        resizeOrigin: state.resizeOrigin,
        activeLayerId: state.activeLayerId,
        layers: state.layers.map((layer) =>
          layer.id === layerId ? { ...layer, opacity } : layer,
        ),
      }),
    ),
  renameLayer: (layerId, name) =>
    set((state) =>
      commitSnapshot(state, {
        title: state.title,
        rows: state.rows,
        stiches: state.stiches,
        hasCanvas: state.hasCanvas,
        canvasBackgroundColor: state.canvasBackgroundColor,
        resizeOrigin: state.resizeOrigin,
        activeLayerId: state.activeLayerId,
        layers: state.layers.map((layer) => (layer.id === layerId ? { ...layer, name } : layer)),
      }),
    ),
  clearDrawingLayer: (layerId) =>
    set((state) =>
      commitSnapshot(state, {
        title: state.title,
        rows: state.rows,
        stiches: state.stiches,
        hasCanvas: state.hasCanvas,
        canvasBackgroundColor: state.canvasBackgroundColor,
        resizeOrigin: state.resizeOrigin,
        activeLayerId: state.activeLayerId,
        layers: state.layers.map((layer) =>
          layer.id === layerId && layer.type === 'drawing'
            ? {
                ...layer,
                cells: Array.from({ length: state.rows * state.stiches }, () => createBlankCell()),
                placedSymbols: [],
              }
            : layer,
        ),
      }),
    ),
  deleteLayer: (layerId) =>
    set((state) => {
      const nextLayers = state.layers.filter((layer) => layer.id !== layerId);

      return commitSnapshot(
        state,
        {
          title: state.title,
          rows: state.rows,
          stiches: state.stiches,
          hasCanvas: state.hasCanvas,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: state.resizeOrigin,
          activeLayerId: state.activeLayerId === layerId ? nextLayers[0]?.id ?? null : state.activeLayerId,
          layers: nextLayers,
        },
        null,
      );
    }),
  duplicateLayer: (layerId) =>
    set((state) => {
      const sourceIndex = state.layers.findIndex((layer) => layer.id === layerId);

      if (sourceIndex < 0) {
        return state;
      }

      const sourceLayer = state.layers[sourceIndex];
      const duplicatedLayer =
        sourceLayer.type === 'image'
          ? {
              ...sourceLayer,
              id: createLayerId(),
              name: `${sourceLayer.name} 복사본`,
            }
          : {
              ...sourceLayer,
              id: createLayerId(),
              name: `${sourceLayer.name} 복사본`,
              cells: sourceLayer.cells.map(cloneCell),
              placedSymbols: sourceLayer.placedSymbols.map(clonePlacedSymbol),
            };
      const nextLayers = [...state.layers];

      nextLayers.splice(sourceIndex + 1, 0, duplicatedLayer);

      return commitSnapshot(
        state,
        {
          title: state.title,
          rows: state.rows,
          stiches: state.stiches,
          hasCanvas: state.hasCanvas,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: state.resizeOrigin,
          activeLayerId: duplicatedLayer.id,
          layers: nextLayers,
        },
        null,
      );
    }),
  mergeLayerDown: (layerId) =>
    set((state) => {
      const sourceIndex = state.layers.findIndex((layer) => layer.id === layerId);

      if (sourceIndex < 0 || sourceIndex === state.layers.length - 1) {
        return state;
      }

      const sourceLayer = state.layers[sourceIndex];
      const targetLayer = state.layers[sourceIndex + 1];

      if (sourceLayer.type === 'image' || targetLayer.type === 'image') {
        return state;
      }

      const mergedLayer: DrawingLayer = {
        ...targetLayer,
        cells: targetLayer.cells.map((cell, index) => {
          const sourceCell = sourceLayer.cells[index];

          if (!sourceCell || sourceCell.backgroundColor === blankCellColor) {
            return cloneCell(cell);
          }

          return cloneCell(sourceCell);
        }),
        placedSymbols: [
          ...targetLayer.placedSymbols
            .filter(
              (targetSymbol) =>
                !sourceLayer.placedSymbols.some((sourceSymbol) =>
                  symbolsOverlap(
                    sourceSymbol.row,
                    sourceSymbol.column,
                    sourceSymbol.spanRows,
                    sourceSymbol.spanColumns,
                    targetSymbol,
                  ),
                ),
            )
            .map(clonePlacedSymbol),
          ...sourceLayer.placedSymbols.map(clonePlacedSymbol),
        ],
      };

      return commitSnapshot(
        state,
        {
          title: state.title,
          rows: state.rows,
          stiches: state.stiches,
          hasCanvas: state.hasCanvas,
          canvasBackgroundColor: state.canvasBackgroundColor,
          resizeOrigin: state.resizeOrigin,
          activeLayerId: mergedLayer.id,
          layers: state.layers.flatMap((layer, index) => {
            if (index === sourceIndex) {
              return [];
            }

            if (index === sourceIndex + 1) {
              return [mergedLayer];
            }

            return [layer];
          }),
        },
        null,
      );
    }),
  fitImageLayerToCanvas: (layerId) =>
    set((state) =>
      commitSnapshot(state, {
        title: state.title,
        rows: state.rows,
        stiches: state.stiches,
        hasCanvas: state.hasCanvas,
        canvasBackgroundColor: state.canvasBackgroundColor,
        resizeOrigin: state.resizeOrigin,
        activeLayerId: state.activeLayerId,
        layers: state.layers.map((layer) => {
          if (layer.id !== layerId || layer.type !== 'image') {
            return layer;
          }

          const imageFrame = getContainedImageFrame(
            layer.imageWidth,
            layer.imageHeight,
            state.stiches * baseCellSize,
            state.rows * baseCellSize,
          );

          return {
            ...layer,
            width: imageFrame.width,
            height: imageFrame.height,
            offsetX: imageFrame.offsetX,
            offsetY: imageFrame.offsetY,
          };
        }),
      }),
    ),
  setImageLayerSize: (layerId, width, height) =>
    set((state) =>
      commitSnapshot(state, {
        title: state.title,
        rows: state.rows,
        stiches: state.stiches,
        hasCanvas: state.hasCanvas,
        canvasBackgroundColor: state.canvasBackgroundColor,
        resizeOrigin: state.resizeOrigin,
        activeLayerId: state.activeLayerId,
        layers: state.layers.map((layer) =>
          layer.id === layerId && layer.type === 'image'
            ? {
                ...layer,
                width,
                height,
                offsetX: layer.offsetX + (layer.width - width) / 2,
                offsetY: layer.offsetY + (layer.height - height) / 2,
              }
            : layer,
        ),
      }),
    ),
  undo: () =>
    set((state) => {
      const previous = state.historyPast[state.historyPast.length - 1];

      if (!previous) {
        return state;
      }

      return {
        ...snapshotFromState(previous),
        historyPast: state.historyPast.slice(0, -1),
        historyFuture: [snapshotFromState(state), ...state.historyFuture],
        selection: null,
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.historyFuture[0];

      if (!next) {
        return state;
      }

      return {
        ...snapshotFromState(next),
        historyPast: [...state.historyPast, snapshotFromState(state)],
        historyFuture: state.historyFuture.slice(1),
        selection: null,
      };
    }),
  reset: () => {
    const nextSnapshot = createInitialSnapshot();

    set({
      ...nextSnapshot,
      historyPast: [],
      historyFuture: [],
      selection: null,
    });
  },
}));
