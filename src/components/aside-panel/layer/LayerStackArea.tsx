'use client';

import { DragEvent, MouseEvent, TouchEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, GripVertical, ImageIcon, PencilLine } from 'lucide-react';

import { defaultCanvasSymbolOptions, renderSymbolPreview } from '@/components/aside-panel/tool/canvasSymbols';
import { contextMenuClassName, inputClassName, panelSectionClassName } from '@/components/ui/sharedStyles';
import { cn } from "@/lib/utils";
import { ImageLayer, Layer } from '@/stores/useCanvasStore';

const contextMenuInset = {
  left: 120,
  top: 72,
  right: 16,
  bottom: 16,
};

const cellUnitSize = 24;

type LayerStackProps = {
  layers: Layer[];
  activeLayerId: string | null;
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
};

export default function LayerStackArea({
  layers,
  activeLayerId,
  setActiveLayer,
  moveLayer,
  toggleLayerVisibility,
  setLayerOpacity,
  renameLayer,
  clearDrawingLayer,
  deleteLayer,
  duplicateLayer,
  mergeLayerDown,
  fitImageLayerToCanvas,
  setImageLayerSize,
}: LayerStackProps) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ layerId: string; x: number; y: number } | null>(null);
  const contextLayer = useMemo(
    () => layers.find((layer) => layer.id === contextMenu?.layerId) ?? null,
    [contextMenu?.layerId, layers],
  );

  useEffect(() => {
    if (!contextMenu || !contextMenuRef.current) {
      return;
    }

    const rect = contextMenuRef.current.getBoundingClientRect();
    const maxX = Math.max(contextMenuInset.left, window.innerWidth - rect.width - contextMenuInset.right);
    const maxY = Math.max(contextMenuInset.top, window.innerHeight - rect.height - contextMenuInset.bottom);
    const nextX = Math.min(Math.max(contextMenu.x, contextMenuInset.left), maxX);
    const nextY = Math.min(Math.max(contextMenu.y, contextMenuInset.top), maxY);

    if (nextX !== contextMenu.x || nextY !== contextMenu.y) {
      setContextMenu((currentMenu) =>
        currentMenu
          ? {
              ...currentMenu,
              x: nextX,
              y: nextY,
            }
          : currentMenu,
      );
    }
  }, [contextMenu, contextLayer]);

  function openContextMenu(layerId: string, x: number, y: number) {
    setContextMenu({
      layerId,
      x: Math.max(contextMenuInset.left, x),
      y: Math.max(contextMenuInset.top, y),
    });
    setActiveLayer(layerId);
  }

  return (
    <div className={`${panelSectionClassName} mt-3 min-h-0 max-h-80 flex-1 overflow-y-auto`}>
      <div className="flex flex-col gap-2">
        {layers.map((layer) => {
          const previewCell =
            layer.type === 'drawing' ? layer.cells.find((cell) => cell.backgroundColor !== '#ffffff') : null;
          const previewSymbol = layer.type === 'drawing' ? layer.placedSymbols[0] ?? null : null;
          const mergeTargetIndex = layers.findIndex((candidate) => candidate.id === layer.id);
          const canMergeDown =
            layer.type !== 'image' &&
            mergeTargetIndex >= 0 &&
            mergeTargetIndex < layers.length - 1 &&
            layers[mergeTargetIndex + 1]?.type !== 'image';
          const contextImageLayer = contextLayer?.type === 'image' ? (contextLayer as ImageLayer) : null;

          return (
            <div
              key={layer.id}
              className={`flex items-center gap-3 rounded-xl border px-2 py-2 transition ${
                activeLayerId === layer.id
                  ? 'border-sky-400 bg-sky-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setActiveLayer(layer.id)}
              onContextMenu={(event: MouseEvent<HTMLDivElement>) => {
                event.preventDefault();
                openContextMenu(layer.id, event.clientX, event.clientY);
              }}
              onTouchStart={(event: TouchEvent<HTMLDivElement>) => {
                const touch = event.touches[0];

                longPressTimerRef.current = setTimeout(() => {
                  openContextMenu(layer.id, touch.clientX, touch.clientY);
                }, 450);
              }}
              onTouchEnd={() => {
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                }
              }}
              onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
              onDrop={() => {
                if (!dragLayerId) {
                  return;
                }

                moveLayer(dragLayerId, layer.id);
                setDragLayerId(null);
              }}
            >
              <button
                type="button"
                draggable
                aria-label={`${layer.name} 순서 변경 핸들`}
                className="flex h-10 w-5 shrink-0 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
                onClick={(event) => event.stopPropagation()}
                onContextMenu={(event) => event.stopPropagation()}
                onDragStart={(event: DragEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  event.dataTransfer.effectAllowed = 'move';
                  setDragLayerId(layer.id);
                }}
                onDragEnd={() => setDragLayerId(null)}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                {layer.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={layer.name} className="h-full w-full object-cover" src={layer.thumbnail} />
                ) : previewCell || previewSymbol ? (
                  <div
                    className="flex min-h-8 min-w-8 items-center justify-center rounded border border-slate-300 p-1 text-[10px] font-semibold"
                    style={{
                      backgroundColor: previewCell?.backgroundColor ?? '#ffffff',
                      color: previewSymbol?.symbolColor ?? '#000000',
                    }}
                  >
                    {previewSymbol
                      ? renderSymbolPreview(
                          defaultCanvasSymbolOptions.find((symbol) => symbol.id === previewSymbol.symbolId) ?? {
                            id: previewSymbol.symbolId,
                            label: previewSymbol.symbolText,
                            kind: /^[A-Z]{1,3}$/.test(previewSymbol.symbolText) ? 'alphabet' : 'svg',
                            spanColumns: previewSymbol.spanColumns,
                            spanRows: previewSymbol.spanRows,
                            draw: () => {},
                          },
                          previewSymbol.symbolColor,
                          16,
                        )
                      : null}
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded border border-slate-300 bg-white" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">
                    {layer.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-700">{layer.name}</span>
                </div>
                <p className="text-xs text-slate-500">{layer.type === 'image' ? '이미지 레이어' : '드로잉 레이어'}</p>
              </div>

              <button
                type="button"
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
              >
                {layer.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>

              {contextMenu?.layerId === layer.id && contextLayer ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setContextMenu(null)}
                  />
                  <div
                    ref={contextMenuRef}
                    className="fixed z-20 flex w-72 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
                    style={{
                      left: contextMenu.x,
                      top: contextMenu.y,
                    }}
                    onClick={(event) => event.stopPropagation()}
                    onContextMenu={(event) => event.preventDefault()}
                    onDragStart={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onTouchStart={(event) => event.stopPropagation()}
                    onTouchMove={(event) => event.stopPropagation()}
                    onTouchEnd={(event) => event.stopPropagation()}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">{contextLayer.name}</p>
                      <p className="text-xs text-slate-500">{contextLayer.type === 'image' ? '이미지 레이어' : '드로잉 레이어'}</p>
                    </div>

                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                      <span>투명도</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(contextLayer.opacity * 100)}
                          className="flex-1 accent-sky-600"
                          onChange={(event) =>
                            setLayerOpacity(contextLayer.id, Number.parseInt(event.target.value, 10) / 100)
                          }
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={Math.round(contextLayer.opacity * 100)}
                            className={`${inputClassName} w-20 px-2 py-1.5`}
                            onChange={(event) => {
                              const nextValue = Number.parseInt(event.target.value || '0', 10);

                              if (Number.isNaN(nextValue)) {
                                return;
                              }

                              setLayerOpacity(contextLayer.id, Math.min(100, Math.max(0, nextValue)) / 100);
                            }}
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      </div>
                    </label>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        className={contextMenuClassName}
                        onClick={() => {
                          const nextName = window.prompt('레이어 이름을 입력하세요.', contextLayer.name);

                          if (nextName && nextName.trim()) {
                            renameLayer(contextLayer.id, nextName.trim());
                          }
                        }}
                      >
                        이름 변경
                      </button>
                      <button type="button" className={contextMenuClassName} onClick={() => duplicateLayer(contextLayer.id)}>
                        레이어 복제
                      </button>
                      {contextLayer.type === 'drawing' ? (
                        <button
                          type="button"
                          className={contextMenuClassName}
                          onClick={() => {
                            clearDrawingLayer(contextLayer.id);
                            setContextMenu(null);
                          }}
                        >
                          전체 지우기
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={cn(contextMenuClassName, 'text-rose-600 hover:bg-rose-100 hover:text-rose-600')}
                        onClick={() => {
                          if (window.confirm('이 레이어를 삭제할까요?')) {
                            deleteLayer(contextLayer.id);
                            setContextMenu(null);
                          }
                        }}
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        disabled={!canMergeDown}
                        className={`${contextMenuClassName} disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300`}
                        onClick={() => mergeLayerDown(contextLayer.id)}
                      >
                        아래 레이어와 합치기
                      </button>
                    </div>

                    {contextImageLayer ? (
                      <div className="flex flex-col gap-3 border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          className={contextMenuClassName}
                          onClick={() => fitImageLayerToCanvas(contextLayer.id)}
                        >
                          캔버스에 맞추기
                        </button>

                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                          <span>가로 크기</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="200"
                              value={Math.max(1, Math.round(contextImageLayer.width / cellUnitSize))}
                              className="flex-1 accent-sky-600"
                              onChange={(event) =>
                                setImageLayerSize(
                                  contextLayer.id,
                                  Math.max(1, Number.parseInt(event.target.value, 10)) * cellUnitSize,
                                  contextImageLayer.height,
                                )
                              }
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={Math.max(1, Math.round(contextImageLayer.width / cellUnitSize))}
                                className={`${inputClassName} w-20 px-2 py-1.5`}
                                onChange={(event) => {
                                  const nextValue = Number.parseInt(event.target.value || '1', 10);

                                  if (Number.isNaN(nextValue)) {
                                    return;
                                  }

                                  setImageLayerSize(
                                    contextLayer.id,
                                    Math.max(1, nextValue) * cellUnitSize,
                                    contextImageLayer.height,
                                  );
                                }}
                              />
                              <span className="text-xs text-slate-500">코</span>
                            </div>
                          </div>
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                          <span>세로 크기</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="200"
                              value={Math.max(1, Math.round(contextImageLayer.height / cellUnitSize))}
                              className="flex-1 accent-sky-600"
                              onChange={(event) =>
                                setImageLayerSize(
                                  contextLayer.id,
                                  contextImageLayer.width,
                                  Math.max(1, Number.parseInt(event.target.value, 10)) * cellUnitSize,
                                )
                              }
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={Math.max(1, Math.round(contextImageLayer.height / cellUnitSize))}
                                className={`${inputClassName} w-20 px-2 py-1.5`}
                                onChange={(event) => {
                                  const nextValue = Number.parseInt(event.target.value || '1', 10);

                                  if (Number.isNaN(nextValue)) {
                                    return;
                                  }

                                  setImageLayerSize(
                                    contextLayer.id,
                                    contextImageLayer.width,
                                    Math.max(1, nextValue) * cellUnitSize,
                                  );
                                }}
                              />
                              <span className="text-xs text-slate-500">단</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
