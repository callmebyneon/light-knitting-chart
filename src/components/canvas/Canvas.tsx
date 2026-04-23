'use client';

import type { PointerEvent, TouchEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { defaultCanvasSymbolOptions, drawPlacedSymbol } from '@/components/aside-panel/tool/canvasSymbols';
import { useCanvasTool } from '@/stores/useCanvasTool';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { Layer } from '@/types/canvas';

const logicalCellSize = 24;
const axisLabelWidth = 42;
const axisLabelHeight = 28;

type RenderCanvasContentInput = {
  context: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  rows: number;
  stiches: number;
  layers: Layer[];
  loadedImages: Record<string, HTMLImageElement>;
  customSymbols: typeof defaultCanvasSymbolOptions;
};

function renderCanvasContent({
  context,
  canvasWidth,
  canvasHeight,
  rows,
  stiches,
  layers,
  loadedImages,
  customSymbols,
}: RenderCanvasContentInput) {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvasWidth, canvasHeight);

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
        context.drawImage(image, layer.offsetX, layer.offsetY, layer.width, layer.height);
      }
    } else {
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

export default function Canvas() {
  const {
    title,
    rows,
    stiches,
    layers,
    activeLayerId,
    paintSymbolCell,
    paintBackgroundCell,
    eraseCellSymbol,
    eraseCellBackground,
    clearCell,
  } = useCanvasStore();
  const {
    activeToolId,
    cursor,
    zoom,
    setZoom,
    saveRequestNonce,
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
  const activeTouchPointerIdsRef = useRef(new Set<number>());
  const pendingTouchPaintRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const latestCanvasSnapshotRef = useRef('');
  const handledSaveRequestNonceRef = useRef(0);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null);
  const canvasWidth = stiches * logicalCellSize;
  const canvasHeight = rows * logicalCellSize;
  const fitScale =
    frameSize.width > 0 && frameSize.height > 0
      ? Math.min(frameSize.width / (canvasWidth + axisLabelWidth), frameSize.height / (canvasHeight + axisLabelHeight))
      : 1;
  const displayScale = Math.max(0.1, fitScale) * zoom;
  const displayWidth = canvasWidth * displayScale;
  const displayHeight = canvasHeight * displayScale;
  const displayCellWidth = displayWidth / stiches;
  const displayCellHeight = displayHeight / rows;
  const bottomAxisLabels = Array.from({ length: stiches }, (_, index) => stiches - index);
  const leftAxisLabels = Array.from({ length: rows }, (_, index) => rows - index);
  const shouldShowCellCursor =
    activeToolId === 'symbol-brush' || activeToolId === 'background-brush' || activeToolId === 'eraser';

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
      rows,
      stiches,
      layers,
      loadedImages,
      customSymbols,
    });
  }, [
    canvasHeight,
    canvasWidth,
    customSymbols,
    displayHeight,
    displayScale,
    displayWidth,
    layers,
    loadedImages,
    rows,
    stiches,
  ]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const serializedCanvas = JSON.stringify({
      title,
      rows,
      stiches,
      activeLayerId,
      layers,
    });

    latestCanvasSnapshotRef.current = serializedCanvas;
    localStorage.setItem('light-knitting-chart:latest', serializedCanvas);
  }, [activeLayerId, layers, rows, stiches, title]);

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

    exportCanvas.width = Math.max(1, Math.round(canvasWidth * devicePixelRatio));
    exportCanvas.height = Math.max(1, Math.round(canvasHeight * devicePixelRatio));
    exportContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    renderCanvasContent({
      context: exportContext,
      canvasWidth,
      canvasHeight,
      rows,
      stiches,
      layers,
      loadedImages,
      customSymbols,
    });

    const dataUrl = exportCanvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    const safeTitle = title
      .trim()
      .replace(/[^\w가-힣-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    anchor.href = dataUrl;
    anchor.download = `${safeTitle || 'light-knitting-chart'}-${Date.now()}.png`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    localStorage.setItem('light-knitting-chart:latest-image', dataUrl);
    localStorage.setItem('light-knitting-chart:latest', latestCanvasSnapshotRef.current);
  }, [canvasHeight, canvasWidth, customSymbols, layers, loadedImages, rows, saveRequestNonce, stiches, title]);

  function paintFromPointer(clientX: number, clientY: number) {
    if (!canvasRef.current || pinchStateRef.current !== null || activeTouchPointerIdsRef.current.size > 1) {
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
      paintBackgroundCell(cell.row, cell.column, backgroundColor);
      return;
    }

    if (activeToolId === 'symbol-brush' || activeToolId === 'fill') {
      paintSymbolCell(cell.row, cell.column, {
        symbolId: symbolOption.id,
        symbolText: symbolOption.text,
        spanRows: symbolOption.spanRows,
        spanColumns: symbolOption.spanColumns,
        symbolColor,
      });
    }
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

  function trackPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === 'touch') {
      activeTouchPointerIdsRef.current.add(event.pointerId);
    }
  }

  function trackPointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === 'touch') {
      activeTouchPointerIdsRef.current.delete(event.pointerId);
    }

    if (activeTouchPointerIdsRef.current.size === 0) {
      pinchStateRef.current = null;
      pendingTouchPaintRef.current = null;
    }
  }

  function getTouchDistance(touches: TouchEvent<HTMLDivElement>['touches']) {
    const firstTouch = touches[0];
    const secondTouch = touches[1];

    return Math.hypot(firstTouch.clientX - secondTouch.clientX, firstTouch.clientY - secondTouch.clientY);
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-[#f5f5f5] p-5 overflow-auto">
      <div ref={frameRef} className="min-h-0 flex-1 overflow-auto">
        <div
          className="flex min-h-full min-w-full items-center justify-center p-6"
          onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
            if (event.touches.length !== 2) {
              return;
            }

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
            className="relative"
            style={{
              width: `${displayWidth + axisLabelWidth}px`,
              height: `${displayHeight + axisLabelHeight}px`,
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
                  cursor: shouldShowCellCursor ? 'none' : cursor,
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  touchAction: 'none',
                }}
                onPointerDown={(event) => {
                  trackPointerDown(event);
                  updateHoveredCell(event.clientX, event.clientY);

                  if (event.pointerType === 'touch') {
                    pendingTouchPaintRef.current = { clientX: event.clientX, clientY: event.clientY };
                    return;
                  }

                  paintFromPointer(event.clientX, event.clientY);
                }}
                onPointerMove={(event) => {
                  updateHoveredCell(event.clientX, event.clientY);

                  if (event.buttons !== 1) {
                    return;
                  }

                  if (event.pointerType === 'touch') {
                    pendingTouchPaintRef.current = null;
                  }

                  paintFromPointer(event.clientX, event.clientY);
                }}
                onPointerUp={(event) => {
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
                  trackPointerEnd(event);
                }}
              />
              {shouldShowCellCursor && hoveredCell ? (
                <div
                  className="pointer-events-none absolute border border-white outline-1 outline-black bg-transparent"
                  style={{
                    left: `${hoveredCell.column * displayCellWidth}px`,
                    top: `${hoveredCell.row * displayCellHeight}px`,
                    width: `${displayCellWidth}px`,
                    height: `${displayCellHeight}px`,
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
    </section>
  );
}
