'use client';

import type { PointerEvent, TouchEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { defaultCanvasSymbolOptions, drawPlacedSymbol } from '@/components/aside-panel/tool/canvasSymbols';
import { contextMenuClassName } from '@/components/ui/sharedStyles';
import { useColorHistory } from '@/stores/useColorHistory';
import { useCanvasTool } from '@/stores/useCanvasTool';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { Layer } from '@/types/canvas';
import { canvasSessionStorageKeys } from '@/utils/canvasSessionStorage';

const logicalCellSize = 24;
const axisLabelWidth = 42;
const axisLabelHeight = 28;
const canvasContextMenuInset = {
  left: 16,
  top: 72,
  right: 16,
  bottom: 16,
};

type RenderCanvasContentInput = {
  context: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  canvasBackgroundColor: string;
  rows: number;
  stiches: number;
  layers: Layer[];
  loadedImages: Record<string, HTMLImageElement>;
  customSymbols: typeof defaultCanvasSymbolOptions;
  includeGrid: boolean;
  layerMovePreview?:
    | {
        layerId: string;
        rowDelta: number;
        columnDelta: number;
        offsetXDelta: number;
        offsetYDelta: number;
      }
    | undefined;
};

function renderLayerContent({
  context,
  rows,
  stiches,
  layers,
  loadedImages,
  customSymbols,
  layerMovePreview,
}: Omit<RenderCanvasContentInput, 'canvasWidth' | 'canvasHeight' | 'canvasBackgroundColor' | 'includeGrid'>) {
  for (let layerIndex = layers.length - 1; layerIndex >= 0; layerIndex -= 1) {
    const layer = layers[layerIndex];

    if (!layer.visible) {
      continue;
    }

    context.save();
    context.globalAlpha = layer.opacity;

    if (layer.type === 'image') {
      const image = loadedImages[layer.id];

      if (image) {
        const centerX =
          layer.offsetX +
          (layerMovePreview?.layerId === layer.id ? layerMovePreview.offsetXDelta : 0) +
          layer.width / 2;
        const centerY =
          layer.offsetY +
          (layerMovePreview?.layerId === layer.id ? layerMovePreview.offsetYDelta : 0) +
          layer.height / 2;

        context.translate(centerX, centerY);
        context.scale(layer.isFlippedHorizontally ? -1 : 1, layer.isFlippedVertically ? -1 : 1);
        context.drawImage(image, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
      }
    } else {
      const rowDelta = layerMovePreview?.layerId === layer.id ? layerMovePreview.rowDelta : 0;
      const columnDelta = layerMovePreview?.layerId === layer.id ? layerMovePreview.columnDelta : 0;

      if (rowDelta !== 0 || columnDelta !== 0) {
        context.translate(columnDelta * logicalCellSize, rowDelta * logicalCellSize);
      }

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < stiches; column += 1) {
          const cell = layer.cells[row * stiches + column];

          if (!cell) {
            continue;
          }

          if (cell.backgroundColor !== '#ffffff') {
            context.fillStyle = cell.backgroundColor;
            context.fillRect(column * logicalCellSize, row * logicalCellSize, logicalCellSize, logicalCellSize);
          }
        }
      }

      for (const placedSymbol of layer.placedSymbols) {
        const symbolOption =
          [...defaultCanvasSymbolOptions, ...customSymbols].find((symbol) => symbol.id === placedSymbol.symbolId) ??
          defaultCanvasSymbolOptions[0];

        drawPlacedSymbol(context, placedSymbol, symbolOption, logicalCellSize);
      }
    }

    context.restore();
  }
}

function renderGrid({
  context,
  canvasWidth,
  canvasHeight,
  rows,
  stiches,
}: Pick<RenderCanvasContentInput, 'context' | 'canvasWidth' | 'canvasHeight' | 'rows' | 'stiches'>) {
  context.beginPath();
  context.strokeStyle = '#d1d1d1';
  context.lineWidth = 1;

  for (let row = 0; row <= rows; row += 1) {
    const y = row * logicalCellSize + 0.5;

    context.moveTo(0, y);
    context.lineTo(canvasWidth, y);
  }

  for (let column = 0; column <= stiches; column += 1) {
    const x = column * logicalCellSize + 0.5;

    context.moveTo(x, 0);
    context.lineTo(x, canvasHeight);
  }

  context.stroke();

  context.beginPath();
  context.strokeStyle = '#ababab';
  context.lineWidth = 1.5;

  for (let row = rows - 10; row > 0; row -= 10) {
    const y = row * logicalCellSize + 0.5;

    context.moveTo(0, y);
    context.lineTo(canvasWidth, y);
  }

  for (let column = stiches - 10; column > 0; column -= 10) {
    const x = column * logicalCellSize + 0.5;

    context.moveTo(x, 0);
    context.lineTo(x, canvasHeight);
  }

  context.stroke();
}

function renderCanvasContent({
  context,
  canvasWidth,
  canvasHeight,
  canvasBackgroundColor,
  rows,
  stiches,
  layers,
  loadedImages,
  customSymbols,
  includeGrid,
  layerMovePreview,
}: RenderCanvasContentInput) {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = canvasBackgroundColor;
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  renderLayerContent({
    context,
    rows,
    stiches,
    layers,
    loadedImages,
    customSymbols,
    layerMovePreview,
  });

  if (includeGrid) {
    renderGrid({ context, canvasWidth, canvasHeight, rows, stiches });
  }
}

function renderAxisLabels({
  context,
  rows,
  stiches,
  chartOffsetX,
  chartHeight,
}: {
  context: CanvasRenderingContext2D;
  rows: number;
  stiches: number;
  chartOffsetX: number;
  chartHeight: number;
}) {
  context.save();
  context.fillStyle = '#64748b';
  context.font = '500 10px Arial, Helvetica, sans-serif';
  context.textAlign = 'right';
  context.textBaseline = 'middle';

  for (let row = 0; row < rows; row += 1) {
    const label = rows - row;
    const y = row * logicalCellSize + logicalCellSize / 2;

    context.fillText(String(label), chartOffsetX - 8, y);
  }

  context.textAlign = 'center';
  context.textBaseline = 'top';

  for (let column = 0; column < stiches; column += 1) {
    const label = stiches - column;
    const x = chartOffsetX + column * logicalCellSize + logicalCellSize / 2;

    context.fillText(String(label), x, chartHeight + 6);
  }

  context.restore();
}

export default function Canvas() {
  const {
    title,
    rows,
    stiches,
    canvasBackgroundColor,
    layers,
    activeLayerId,
    selection,
    setSelection,
    clearSelection,
    paintSymbolCell,
    paintBackgroundCell,
    eraseCellSymbol,
    eraseCellBackground,
    clearCell,
    moveActiveDrawingLayer,
    moveActiveImageLayer,
    flipActiveLayerHorizontally,
    flipActiveLayerVertically,
    flipSelectionHorizontally,
    flipSelectionVertically,
    duplicateSelection,
  } = useCanvasStore();
  const addColorHistory = useColorHistory((state) => state.addColor);
  const {
    activeToolId,
    cursor,
    zoom,
    setZoom,
    saveRequestNonce,
    saveIncludeAxisLabels,
    saveIncludeGrid,
    isGridVisible,
    customSymbols,
    selectedSymbol,
    symbolColor,
    backgroundColor,
    eraserMode,
    fillMode,
  } = useCanvasTool();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const pinchStateRef = useRef<{ distance: number; zoom: number } | null>(null);
  const panDragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const selectionDragRef = useRef<{ pointerId: number; startRow: number; startColumn: number } | null>(null);
  const layerMoveDragRef = useRef<
    | {
        pointerId: number;
        startRow: number;
        startColumn: number;
        lastRowDelta: number;
        lastColumnDelta: number;
      }
    | {
        pointerId: number;
        startClientX: number;
        startClientY: number;
        lastOffsetXDelta: number;
        lastOffsetYDelta: number;
      }
    | null
  >(null);
  const activeTouchPointerIdsRef = useRef(new Set<number>());
  const pendingTouchPaintRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const touchContextMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCanvasSnapshotRef = useRef('');
  const handledSaveRequestNonceRef = useRef(0);
  const canvasContextMenuRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [layerMovePreview, setLayerMovePreview] = useState<{
    layerId: string;
    rowDelta: number;
    columnDelta: number;
    offsetXDelta: number;
    offsetYDelta: number;
  } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number } | null>(null);
  const canvasWidth = stiches * logicalCellSize;
  const canvasHeight = rows * logicalCellSize;
  const fitScale =
    frameSize.width > 0 && frameSize.height > 0
      ? Math.min(frameSize.width / (canvasWidth + axisLabelWidth), frameSize.height / (canvasHeight + axisLabelHeight))
      : 1;
  const displayScale = Math.max(0.1, fitScale) * zoom;
  const displayWidth = canvasWidth * displayScale;
  const displayHeight = canvasHeight * displayScale;
  const viewportPaddingX = Math.max(frameSize.width / 2, 96);
  const viewportPaddingY = Math.max(frameSize.height / 2, 96);
  const canvasOuterWidth = displayWidth + axisLabelWidth;
  const canvasOuterHeight = displayHeight + axisLabelHeight;
  const scrollContentWidth = canvasOuterWidth + viewportPaddingX * 2;
  const scrollContentHeight = canvasOuterHeight + viewportPaddingY * 2;
  const displayCellWidth = displayWidth / stiches;
  const displayCellHeight = displayHeight / rows;
  const bottomAxisLabels = Array.from({ length: stiches }, (_, index) => stiches - index);
  const leftAxisLabels = Array.from({ length: rows }, (_, index) => rows - index);
  const activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? null;
  const isActiveDrawingLayer = activeLayer?.type === 'drawing';
  const isSelectionTool = activeToolId === 'selection';
  const isMoveTool = activeToolId === 'move';
  const shouldShowCellCursor =
    activeToolId === 'symbol-brush' || activeToolId === 'background-brush' || activeToolId === 'eraser';
  const isPanMode = activeToolId === 'pan';
  const shouldShowSelection = Boolean(selection && isActiveDrawingLayer && isSelectionTool);
  const selectionMenuEnabled = Boolean(selection && isActiveDrawingLayer);
  const activeLayerMovePreview =
    activeToolId === 'move' && activeLayerId && layerMovePreview?.layerId === activeLayerId
      ? layerMovePreview
      : null;

  function clearTouchContextMenuTimer() {
    if (!touchContextMenuTimerRef.current) {
      return;
    }

    clearTimeout(touchContextMenuTimerRef.current);
    touchContextMenuTimerRef.current = null;
  }

  function getPointerCell(clientX: number, clientY: number) {
    if (!canvasRef.current) {
      return null;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const column = Math.floor(((clientX - rect.left) / rect.width) * stiches);
    const row = Math.floor(((clientY - rect.top) / rect.height) * rows);

    if (column < 0 || column >= stiches || row < 0 || row >= rows) {
      return null;
    }

    return { row, column };
  }

  function updateHoveredCell(clientX: number, clientY: number) {
    if (pinchStateRef.current !== null || activeTouchPointerIdsRef.current.size > 1) {
      setHoveredCell(null);
      return;
    }

    setHoveredCell(getPointerCell(clientX, clientY));
  }

  function openCanvasContextMenu(clientX: number, clientY: number) {
    if (!activeLayer) {
      return;
    }

    setCanvasContextMenu({
      x: Math.max(canvasContextMenuInset.left, clientX),
      y: Math.max(canvasContextMenuInset.top, clientY),
    });
  }

  function paintFromPointer(clientX: number, clientY: number) {
    if (
      !canvasRef.current ||
      pinchStateRef.current !== null ||
      activeTouchPointerIdsRef.current.size > 1 ||
      isSelectionTool ||
      isMoveTool
    ) {
      return;
    }

    const cell = getPointerCell(clientX, clientY);

    if (!cell) {
      return;
    }

    const symbolOption =
      [...defaultCanvasSymbolOptions, ...customSymbols].find((symbol) => symbol.id === selectedSymbol) ??
      defaultCanvasSymbolOptions[0];

    if (activeToolId === 'background-brush') {
      addColorHistory(backgroundColor);
      paintBackgroundCell(cell.row, cell.column, backgroundColor);
      return;
    }

    if (activeToolId === 'eraser') {
      if (eraserMode === 'background') {
        eraseCellBackground(cell.row, cell.column);
        return;
      }

      if (eraserMode === 'all') {
        clearCell(cell.row, cell.column);
        return;
      }

      eraseCellSymbol(cell.row, cell.column);
      return;
    }

    if (activeToolId === 'fill' && fillMode === 'background') {
      addColorHistory(backgroundColor);
      paintBackgroundCell(cell.row, cell.column, backgroundColor);
      return;
    }

    if (activeToolId === 'symbol-brush' || activeToolId === 'fill') {
      addColorHistory(symbolColor);
      paintSymbolCell(cell.row, cell.column, {
        symbolId: symbolOption.id,
        symbolText: symbolOption.label,
        spanRows: symbolOption.spanRows,
        spanColumns: symbolOption.spanColumns,
        symbolColor,
      });
    }
  }

  function trackPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === 'touch') {
      activeTouchPointerIdsRef.current.add(event.pointerId);
    }
  }

  function trackPointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === 'touch') {
      activeTouchPointerIdsRef.current.delete(event.pointerId);
    }

    if (panDragRef.current?.pointerId === event.pointerId) {
      panDragRef.current = null;
      setIsPanDragging(false);
    }

    if (selectionDragRef.current?.pointerId === event.pointerId) {
      selectionDragRef.current = null;
    }

    if (layerMoveDragRef.current?.pointerId === event.pointerId) {
      if (
        'lastRowDelta' in layerMoveDragRef.current &&
        (layerMoveDragRef.current.lastRowDelta !== 0 || layerMoveDragRef.current.lastColumnDelta !== 0)
      ) {
        moveActiveDrawingLayer(
          layerMoveDragRef.current.lastRowDelta,
          layerMoveDragRef.current.lastColumnDelta,
        );
      }

      if (
        'lastOffsetXDelta' in layerMoveDragRef.current &&
        (layerMoveDragRef.current.lastOffsetXDelta !== 0 || layerMoveDragRef.current.lastOffsetYDelta !== 0)
      ) {
        moveActiveImageLayer(
          layerMoveDragRef.current.lastOffsetXDelta,
          layerMoveDragRef.current.lastOffsetYDelta,
        );
      }

      layerMoveDragRef.current = null;
      setLayerMovePreview(null);
    }

    clearTouchContextMenuTimer();

    if (activeTouchPointerIdsRef.current.size === 0) {
      pinchStateRef.current = null;
      pendingTouchPaintRef.current = null;
    }
  }

  function startPanDrag(event: PointerEvent<HTMLCanvasElement>) {
    if (!frameRef.current) {
      return;
    }

    panDragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      scrollLeft: frameRef.current.scrollLeft,
      scrollTop: frameRef.current.scrollTop,
    };
    setIsPanDragging(true);
    setHoveredCell(null);
  }

  function updatePanDrag(event: PointerEvent<HTMLCanvasElement>) {
    if (!frameRef.current || !panDragRef.current || panDragRef.current.pointerId !== event.pointerId) {
      return;
    }

    frameRef.current.scrollLeft = panDragRef.current.scrollLeft - (event.clientX - panDragRef.current.clientX);
    frameRef.current.scrollTop = panDragRef.current.scrollTop - (event.clientY - panDragRef.current.clientY);
  }

  function getTouchDistance(touches: TouchEvent<HTMLDivElement>['touches']) {
    const firstTouch = touches[0];
    const secondTouch = touches[1];

    return Math.hypot(firstTouch.clientX - secondTouch.clientX, firstTouch.clientY - secondTouch.clientY);
  }

  function runFlipHorizontal() {
    if (selectionMenuEnabled) {
      flipSelectionHorizontally();
      return;
    }

    flipActiveLayerHorizontally();
  }

  function runFlipVertical() {
    if (selectionMenuEnabled) {
      flipSelectionVertically();
      return;
    }

    flipActiveLayerVertically();
  }

  useEffect(() => {
    if (!frameRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({
        width: Math.max(entry.contentRect.width - 48, 1),
        height: Math.max(entry.contentRect.height - 48, 1),
      });
    });

    observer.observe(frameRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isDisposed = false;

    Promise.all(
      layers
        .filter((layer) => layer.type === 'image')
        .map(
          (layer) =>
            new Promise<[string, HTMLImageElement]>((resolve, reject) => {
              const image = new Image();

              image.onload = () => resolve([layer.id, image]);
              image.onerror = reject;
              image.src = layer.src;
            }),
        ),
    )
      .then((entries) => {
        if (!isDisposed) {
          setLoadedImages(Object.fromEntries(entries));
        }
      })
      .catch(() => {});

    return () => {
      isDisposed = true;
    };
  }, [layers]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const bitmapWidth = Math.max(1, Math.round(displayWidth * devicePixelRatio));
    const bitmapHeight = Math.max(1, Math.round(displayHeight * devicePixelRatio));

    canvas.width = bitmapWidth;
    canvas.height = bitmapHeight;
    context.setTransform(displayScale * devicePixelRatio, 0, 0, displayScale * devicePixelRatio, 0, 0);
    renderCanvasContent({
      context,
      canvasWidth,
      canvasHeight,
      canvasBackgroundColor,
      rows,
      stiches,
      layers,
      loadedImages,
      customSymbols,
      includeGrid: isGridVisible,
      layerMovePreview: activeLayerMovePreview ?? undefined,
    });
  }, [
    canvasHeight,
    canvasBackgroundColor,
    canvasWidth,
    customSymbols,
    displayHeight,
    displayScale,
    displayWidth,
    activeLayerId,
    activeLayerMovePreview,
    isGridVisible,
    layers,
    loadedImages,
    rows,
    stiches,
  ]);

  useEffect(() => {
    if (!frameRef.current) {
      return;
    }

    frameRef.current.scrollLeft = Math.max((scrollContentWidth - frameRef.current.clientWidth) / 2, 0);
    frameRef.current.scrollTop = Math.max((scrollContentHeight - frameRef.current.clientHeight) / 2, 0);
  }, [scrollContentHeight, scrollContentWidth]);

  useEffect(() => {
    if (activeToolId === 'selection' && isActiveDrawingLayer) {
      return;
    }

    if (selection) {
      clearSelection();
    }
  }, [activeToolId, clearSelection, isActiveDrawingLayer, selection]);

  useEffect(() => {
    if (activeToolId === 'move' && activeLayerId) {
      return;
    }

    layerMoveDragRef.current = null;
  }, [activeLayerId, activeToolId]);

  useEffect(() => {
    if (!canvasContextMenu || !canvasContextMenuRef.current) {
      return;
    }

    const rect = canvasContextMenuRef.current.getBoundingClientRect();
    const maxX = Math.max(
      canvasContextMenuInset.left,
      window.innerWidth - rect.width - canvasContextMenuInset.right,
    );
    const maxY = Math.max(
      canvasContextMenuInset.top,
      window.innerHeight - rect.height - canvasContextMenuInset.bottom,
    );
    const nextX = Math.min(Math.max(canvasContextMenu.x, canvasContextMenuInset.left), maxX);
    const nextY = Math.min(Math.max(canvasContextMenu.y, canvasContextMenuInset.top), maxY);

    if (nextX !== canvasContextMenu.x || nextY !== canvasContextMenu.y) {
      setCanvasContextMenu({
        x: nextX,
        y: nextY,
      });
    }
  }, [canvasContextMenu, selectionMenuEnabled]);

  useEffect(
    () => () => {
      clearTouchContextMenuTimer();
    },
    [],
  );

  useEffect(() => {
    const serializedCanvas = JSON.stringify({
      title,
      rows,
      stiches,
      canvasBackgroundColor,
      activeLayerId,
      layers,
    });

    latestCanvasSnapshotRef.current = serializedCanvas;
    sessionStorage.setItem(canvasSessionStorageKeys.latestSnapshot, serializedCanvas);
  }, [activeLayerId, canvasBackgroundColor, layers, rows, stiches, title]);

  useEffect(() => {
    if (saveRequestNonce === 0 || handledSaveRequestNonceRef.current === saveRequestNonce) {
      return;
    }

    handledSaveRequestNonceRef.current = saveRequestNonce;

    const exportCanvas = document.createElement('canvas');
    const exportContext = exportCanvas.getContext('2d');

    if (!exportContext) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const exportWidth = canvasWidth + (saveIncludeAxisLabels ? axisLabelWidth : 0);
    const exportHeight = canvasHeight + (saveIncludeAxisLabels ? axisLabelHeight : 0);

    exportCanvas.width = Math.max(1, Math.round(exportWidth * devicePixelRatio));
    exportCanvas.height = Math.max(1, Math.round(exportHeight * devicePixelRatio));
    exportContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    exportContext.fillStyle = canvasBackgroundColor;
    exportContext.fillRect(0, 0, exportWidth, exportHeight);

    exportContext.save();
    exportContext.translate(saveIncludeAxisLabels ? axisLabelWidth : 0, 0);
    renderCanvasContent({
      context: exportContext,
      canvasWidth,
      canvasHeight,
      canvasBackgroundColor,
      rows,
      stiches,
      layers,
      loadedImages,
      customSymbols,
      includeGrid: saveIncludeGrid,
    });
    exportContext.restore();

    if (saveIncludeAxisLabels) {
      renderAxisLabels({
        context: exportContext,
        rows,
        stiches,
        chartOffsetX: axisLabelWidth,
        chartHeight: canvasHeight,
      });
    }

    const dataUrl = exportCanvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    const safeTitle = title
      .trim()
      .replace(/[^\w가-힣]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    anchor.href = dataUrl;
    anchor.download = `${safeTitle || 'light-knitting-chart'}-${Date.now()}.png`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    sessionStorage.setItem(canvasSessionStorageKeys.latestImage, dataUrl);
    sessionStorage.setItem(canvasSessionStorageKeys.latestSnapshot, latestCanvasSnapshotRef.current);
  }, [
    canvasHeight,
    canvasBackgroundColor,
    canvasWidth,
    customSymbols,
    layers,
    loadedImages,
    rows,
    saveIncludeAxisLabels,
    saveIncludeGrid,
    saveRequestNonce,
    stiches,
    title,
  ]);

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#f5f5f5] pt-26 p-5">
      <div ref={frameRef} className="hover-scrollbar min-h-0 flex-1 overflow-auto">
        <div
          className="relative"
          style={{
            width: `${scrollContentWidth}px`,
            height: `${scrollContentHeight}px`,
          }}
          onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
            if (event.touches.length !== 2) {
              return;
            }

            clearTouchContextMenuTimer();
            pendingTouchPaintRef.current = null;
            pinchStateRef.current = {
              distance: getTouchDistance(event.touches),
              zoom,
            };
          }}
          onTouchMove={(event: TouchEvent<HTMLDivElement>) => {
            if (event.touches.length !== 2 || pinchStateRef.current === null) {
              return;
            }

            event.preventDefault();
            clearTouchContextMenuTimer();

            const nextZoom =
              pinchStateRef.current.zoom *
              (getTouchDistance(event.touches) / pinchStateRef.current.distance);

            setZoom(Math.min(6, Math.max(0.4, Number(nextZoom.toFixed(2)))));
          }}
          onTouchEnd={(event: TouchEvent<HTMLDivElement>) => {
            if (event.touches.length === 0) {
              pinchStateRef.current = null;
            }
          }}
        >
          <div
            className="absolute"
            style={{
              left: `${viewportPaddingX}px`,
              top: `${viewportPaddingY}px`,
              width: `${canvasOuterWidth}px`,
              height: `${canvasOuterHeight}px`,
            }}
          >
            <div
              className="absolute left-0 top-0 flex flex-col text-[10px] font-medium text-slate-500"
              style={{
                width: `${axisLabelWidth}px`,
                height: `${displayHeight}px`,
              }}
            >
              {leftAxisLabels.map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-end pr-2"
                  style={{ height: `${displayCellHeight}px` }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              className="absolute top-0"
              style={{
                left: `${axisLabelWidth}px`,
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
              }}
            >
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
                style={{
                  cursor: isPanMode && isPanDragging ? 'grabbing' : shouldShowCellCursor ? 'none' : cursor,
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  touchAction: 'none',
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  clearTouchContextMenuTimer();
                  openCanvasContextMenu(event.clientX, event.clientY);
                }}
                onPointerDown={(event) => {
                  if (event.pointerType !== 'touch' && event.button !== 0) {
                    return;
                  }

                  trackPointerDown(event);
                  updateHoveredCell(event.clientX, event.clientY);
                  setCanvasContextMenu(null);

                  if (event.pointerType === 'touch' && (isSelectionTool || isMoveTool)) {
                    touchContextMenuTimerRef.current = setTimeout(() => {
                      openCanvasContextMenu(event.clientX, event.clientY);
                    }, 450);
                  }

                  if (isPanMode) {
                    startPanDrag(event);
                    event.currentTarget.setPointerCapture(event.pointerId);
                    return;
                  }

                  if (isSelectionTool && isActiveDrawingLayer) {
                    const cell = getPointerCell(event.clientX, event.clientY);

                    if (!cell) {
                      return;
                    }

                    selectionDragRef.current = {
                      pointerId: event.pointerId,
                      startRow: cell.row,
                      startColumn: cell.column,
                    };
                    setSelection({
                      top: cell.row,
                      left: cell.column,
                      bottom: cell.row,
                      right: cell.column,
                    });
                    event.currentTarget.setPointerCapture(event.pointerId);
                    return;
                  }

                  if (isMoveTool) {
                    if (activeLayer?.type === 'drawing') {
                      const cell = getPointerCell(event.clientX, event.clientY);

                      if (!cell) {
                        return;
                      }

                      layerMoveDragRef.current = {
                        pointerId: event.pointerId,
                        startRow: cell.row,
                        startColumn: cell.column,
                        lastRowDelta: 0,
                        lastColumnDelta: 0,
                      };
                      setLayerMovePreview({
                        layerId: activeLayer.id,
                        rowDelta: 0,
                        columnDelta: 0,
                        offsetXDelta: 0,
                        offsetYDelta: 0,
                      });
                      event.currentTarget.setPointerCapture(event.pointerId);
                    } else if (activeLayer?.type === 'image') {
                      layerMoveDragRef.current = {
                        pointerId: event.pointerId,
                        startClientX: event.clientX,
                        startClientY: event.clientY,
                        lastOffsetXDelta: 0,
                        lastOffsetYDelta: 0,
                      };
                      setLayerMovePreview({
                        layerId: activeLayer.id,
                        rowDelta: 0,
                        columnDelta: 0,
                        offsetXDelta: 0,
                        offsetYDelta: 0,
                      });
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }

                    return;
                  }

                  if (event.pointerType === 'touch') {
                    pendingTouchPaintRef.current = { clientX: event.clientX, clientY: event.clientY };
                    return;
                  }

                  paintFromPointer(event.clientX, event.clientY);
                }}
                onPointerMove={(event) => {
                  if (
                    touchContextMenuTimerRef.current &&
                    (event.pointerType === 'touch' || Math.abs(event.movementX) > 0 || Math.abs(event.movementY) > 0)
                  ) {
                    clearTouchContextMenuTimer();
                  }

                  if (isPanMode) {
                    updatePanDrag(event);
                    return;
                  }

                  updateHoveredCell(event.clientX, event.clientY);

                  if (
                    selectionDragRef.current &&
                    selectionDragRef.current.pointerId === event.pointerId &&
                    isSelectionTool &&
                    isActiveDrawingLayer
                  ) {
                    const cell = getPointerCell(event.clientX, event.clientY);

                    if (!cell) {
                      return;
                    }

                    setSelection({
                      top: selectionDragRef.current.startRow,
                      left: selectionDragRef.current.startColumn,
                      bottom: cell.row,
                      right: cell.column,
                    });
                    return;
                  }

                  if (isMoveTool && layerMoveDragRef.current?.pointerId === event.pointerId) {
                    if ('startRow' in layerMoveDragRef.current) {
                      const cell = getPointerCell(event.clientX, event.clientY);

                      if (!cell || !activeLayer) {
                        return;
                      }

                      const rowDelta = cell.row - layerMoveDragRef.current.startRow;
                      const columnDelta = cell.column - layerMoveDragRef.current.startColumn;

                      layerMoveDragRef.current.lastRowDelta = rowDelta;
                      layerMoveDragRef.current.lastColumnDelta = columnDelta;
                      setLayerMovePreview({
                        layerId: activeLayer.id,
                        rowDelta,
                        columnDelta,
                        offsetXDelta: 0,
                        offsetYDelta: 0,
                      });
                      return;
                    }

                    if ('startClientX' in layerMoveDragRef.current && activeLayer) {
                      const offsetXDelta = (event.clientX - layerMoveDragRef.current.startClientX) / displayScale;
                      const offsetYDelta = (event.clientY - layerMoveDragRef.current.startClientY) / displayScale;

                      layerMoveDragRef.current.lastOffsetXDelta = offsetXDelta;
                      layerMoveDragRef.current.lastOffsetYDelta = offsetYDelta;
                      setLayerMovePreview({
                        layerId: activeLayer.id,
                        rowDelta: 0,
                        columnDelta: 0,
                        offsetXDelta,
                        offsetYDelta,
                      });
                    }

                    return;
                  }

                  if (isMoveTool || event.buttons !== 1) {
                    return;
                  }

                  if (event.pointerType === 'touch') {
                    pendingTouchPaintRef.current = null;
                  }

                  paintFromPointer(event.clientX, event.clientY);
                }}
                onPointerUp={(event) => {
                  if (isPanMode) {
                    trackPointerEnd(event);
                    return;
                  }

                  if (selectionDragRef.current?.pointerId === event.pointerId) {
                    trackPointerEnd(event);
                    return;
                  }

                  const pendingTouchPaint = pendingTouchPaintRef.current;

                  if (
                    event.pointerType === 'touch' &&
                    pendingTouchPaint &&
                    pinchStateRef.current === null &&
                    activeTouchPointerIdsRef.current.size === 1
                  ) {
                    paintFromPointer(pendingTouchPaint.clientX, pendingTouchPaint.clientY);
                  }

                  trackPointerEnd(event);
                }}
                onPointerCancel={trackPointerEnd}
                onPointerLeave={(event) => {
                  setHoveredCell(null);

                  if (
                    panDragRef.current?.pointerId === event.pointerId ||
                    selectionDragRef.current?.pointerId === event.pointerId ||
                    layerMoveDragRef.current?.pointerId === event.pointerId
                  ) {
                    return;
                  }

                  trackPointerEnd(event);
                }}
              />

              {shouldShowCellCursor && hoveredCell ? (
                <div
                  className="pointer-events-none absolute border border-white bg-transparent outline-1 outline-black"
                  style={{
                    left: `${hoveredCell.column * displayCellWidth}px`,
                    top: `${hoveredCell.row * displayCellHeight}px`,
                    width: `${displayCellWidth}px`,
                    height: `${displayCellHeight}px`,
                  }}
                />
              ) : null}

              {shouldShowSelection && selection ? (
                <div
                  className="selection-outline pointer-events-none absolute"
                  style={{
                    left: `${selection.left * displayCellWidth}px`,
                    top: `${selection.top * displayCellHeight}px`,
                    width: `${(selection.right - selection.left + 1) * displayCellWidth}px`,
                    height: `${(selection.bottom - selection.top + 1) * displayCellHeight}px`,
                  }}
                />
              ) : null}
            </div>

            <div
              className="absolute text-[10px] font-medium text-slate-500"
              style={{
                left: `${axisLabelWidth}px`,
                top: `${displayHeight}px`,
                width: `${displayWidth}px`,
                height: `${axisLabelHeight}px`,
              }}
            >
              <div className="flex h-full">
                {bottomAxisLabels.map((label) => (
                  <div
                    key={label}
                    className="flex items-start justify-center pt-1"
                    style={{ width: `${displayCellWidth}px` }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {canvasContextMenu && activeLayer ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="캔버스 메뉴 닫기"
            onClick={() => setCanvasContextMenu(null)}
          />
          <div
            ref={canvasContextMenuRef}
            className="fixed z-20 flex w-56 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
            style={{
              left: canvasContextMenu.x,
              top: canvasContextMenu.y,
            }}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
          >
            {selectionMenuEnabled ? (
              <>
                <button
                  type="button"
                  className={contextMenuClassName}
                  onClick={() => {
                    runFlipHorizontal();
                    setCanvasContextMenu(null);
                  }}
                >
                  선택 영역 좌우 뒤집기
                </button>
                <button
                  type="button"
                  className={contextMenuClassName}
                  onClick={() => {
                    runFlipVertical();
                    setCanvasContextMenu(null);
                  }}
                >
                  선택 영역 상하 뒤집기
                </button>
                <button
                  type="button"
                  className={contextMenuClassName}
                  onClick={() => {
                    duplicateSelection();
                    setCanvasContextMenu(null);
                  }}
                >
                  선택 영역 복제
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={contextMenuClassName}
                  onClick={() => {
                    runFlipHorizontal();
                    setCanvasContextMenu(null);
                  }}
                >
                  현재 레이어 좌우 뒤집기
                </button>
                <button
                  type="button"
                  className={contextMenuClassName}
                  onClick={() => {
                    runFlipVertical();
                    setCanvasContextMenu(null);
                  }}
                >
                  현재 레이어 상하 뒤집기
                </button>
              </>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
