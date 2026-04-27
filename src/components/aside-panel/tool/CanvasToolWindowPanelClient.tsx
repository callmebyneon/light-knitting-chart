'use client';

import { ChangeEvent, DragEvent, MouseEvent, TouchEvent, useEffect, useMemo, useRef, useState } from 'react';
import { PanelRightOpen } from 'lucide-react';

import LayerStackArea from '@/components/aside-panel/layer/LayerStackArea';
import { defaultCanvasSymbolOptions, renderSymbolPreview } from '@/components/aside-panel/tool/canvasSymbols';
import {
  buttonClassName,
  iconButtonClassName,
  inputClassName,
  panelSecionTitleClassName,
  panelSectionClassName,
  panelShellClassName,
  contextMenuClassName,
} from '@/components/ui/sharedStyles';
import { useColorHistory } from '@/stores/useColorHistory';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useCanvasTool } from '@/stores/useCanvasTool';

import type { CanvasSymbolOption } from './canvasSymbolTypes';

type SymbolOptionGroup = {
  key: string;
  spanColumns: number;
  spanRows: number;
  symbols: CanvasSymbolOption[];
};

type ColorHistorySwatchesProps = {
  colors: string[];
  onSelect: (color: string) => void;
};

function ColorHistorySwatches({ colors, onSelect }: ColorHistorySwatchesProps) {
  if (colors.length === 0) {
    return (
      <div className="rounded-md bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
        아직 사용한 색상이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className="flex items-center rounded-md border border-slate-200 bg-white px-2 py-2 text-left text-xs text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
          onClick={() => onSelect(color)}
          title={color}
        >
          <span
            className="h-5 w-5 shrink-0 rounded border border-slate-200"
            style={{ backgroundColor: color }}
          />
          <span className="truncate font-mono">{color}</span>
        </button>
      ))}
    </div>
  );
}

export default function CanvasToolWindowPanelClient() {
  const {
    layers,
    activeLayerId,
    addDrawingLayer,
    addImageLayer,
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
  } = useCanvasStore();
  const {
    panelMode,
    symbolColor,
    backgroundColor,
    selectedSymbol,
    symbolInputMode,
    customSymbols,
    alphabetSymbolDraft,
    eraserMode,
    fillMode,
    isPortraitViewport,
    isRightPanelOpen,
    setSymbolColor,
    setBackgroundColor,
    setSelectedSymbol,
    setSymbolInputMode,
    setAlphabetSymbolDraft,
    addAlphabetSymbol,
    deleteCustomSymbol,
    setEraserMode,
    setFillMode,
    toggleRightPanel,
  } = useCanvasTool();
  const colorHistory = useColorHistory((state) => state.colors);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customSymbolMenuRef = useRef<HTMLDivElement | null>(null);
  const [customSymbolMenu, setCustomSymbolMenu] = useState<{ symbolId: string; x: number; y: number } | null>(null);
  const defaultSymbolGroups = useMemo<SymbolOptionGroup[]>(() => {
    const groups = new Map<string, SymbolOptionGroup>();

    for (const symbol of defaultCanvasSymbolOptions) {
      const key = `${symbol.spanColumns} x ${symbol.spanRows}`;
      const group = groups.get(key);

      if (group) {
        group.symbols.push(symbol);
        continue;
      }

      groups.set(key, {
        key,
        spanColumns: symbol.spanColumns,
        spanRows: symbol.spanRows,
        symbols: [symbol],
      });
    }

    return [...groups.values()].sort(
      (first, second) => first.spanColumns - second.spanColumns || first.spanRows - second.spanRows,
    );
  }, []);
  const selectedSymbolOption =
    [...defaultCanvasSymbolOptions, ...customSymbols].find((symbol) => symbol.id === selectedSymbol) ??
    defaultCanvasSymbolOptions[0];
  const contextCustomSymbol = customSymbols.find((symbol) => symbol.id === customSymbolMenu?.symbolId) ?? null;
  const isCollapsed = isPortraitViewport && !isRightPanelOpen;

  useEffect(() => {
    if (!customSymbolMenu || !customSymbolMenuRef.current) {
      return;
    }

    const rect = customSymbolMenuRef.current.getBoundingClientRect();
    const nextX = Math.min(Math.max(customSymbolMenu.x, 16), window.innerWidth - rect.width - 16);
    const nextY = Math.min(Math.max(customSymbolMenu.y, 16), window.innerHeight - rect.height - 16);

    if (nextX !== customSymbolMenu.x || nextY !== customSymbolMenu.y) {
      setCustomSymbolMenu((currentMenu) =>
        currentMenu
          ? {
              ...currentMenu,
              x: nextX,
              y: nextY,
            }
          : currentMenu,
      );
    }
  }, [customSymbolMenu]);

  useEffect(
    () => () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    },
    [],
  );

  function openCustomSymbolMenu(symbolId: string, x: number, y: number) {
    setCustomSymbolMenu({ symbolId, x, y });
    setSelectedSymbol(symbolId);
  }

  function clearLongPressTimer() {
    if (!longPressTimerRef.current) {
      return;
    }

    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }

  async function importImageFile(file: File) {
    const src = URL.createObjectURL(file);
    const image = new Image();

    image.src = src;
    await image.decode();

    addImageLayer({
      name: file.name.replace(/\.[^.]+$/, '') || '이미지 레이어',
      src,
      thumbnail: src,
      imageWidth: image.width,
      imageHeight: image.height,
    });
  }

  async function handleImageLayerImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await importImageFile(file);
    event.target.value = '';
  }

  return (
    <aside
      className={`${panelShellClassName} border-l transition-[width] duration-200 ${isCollapsed ? 'w-15' : 'w-[320px] p-3'}`}
    >
      {isCollapsed ? (
        <div className="flex h-full items-start justify-center pt-4">
          <button type="button" className={iconButtonClassName} onClick={toggleRightPanel} aria-label="오른쪽 패널 열기">
            <PanelRightOpen className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className={panelSecionTitleClassName}>도구 설정</h2>
            {isPortraitViewport ? (
              <button type="button" className={iconButtonClassName} onClick={toggleRightPanel} aria-label="오른쪽 패널 접기">
                <PanelRightOpen className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <section className={panelSectionClassName}>
            {panelMode === 'image-import' ? (
              <div
                className="flex flex-col gap-3"
                onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files[0];

                  if (file) {
                    void importImageFile(file);
                  }
                }}
              >
                <p className="text-sm font-semibold text-slate-700">이미지 가져오기</p>
                <button type="button" className={buttonClassName} onClick={() => fileInputRef.current?.click()}>
                  파일 선택
                </button>
                <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                  이미지를 드래그 앤 드롭하거나 파일 선택으로 추가합니다.
                </div>
              </div>
            ) : null}

            {panelMode === 'symbol-brush' ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-700">차트 기호 브러시</p>
                <div className="flex flex-col gap-2 text-sm text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      className="accent-sky-600"
                      checked={symbolInputMode === 'svg'}
                      onChange={() => setSymbolInputMode('svg')}
                    />
                    기본 SVG 기호 선택
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      className="accent-sky-600"
                      checked={symbolInputMode === 'alphabet'}
                      onChange={() => setSymbolInputMode('alphabet')}
                    />
                    커스텀 알파벳 브러시
                  </label>
                </div>

                {symbolInputMode === 'svg' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <span>기본 기호 선택</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                      {defaultSymbolGroups.map((group) => (
                        <div key={group.key} className="mb-3 last:mb-0">
                          <div className="sticky top-0 z-10 bg-white/95 py-1 text-[11px] font-semibold text-slate-500">
                            {group.key}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {group.symbols.map((symbol) => (
                              <button
                                key={symbol.id}
                                type="button"
                                title={symbol.label}
                                className={`flex min-h-20 flex-col items-center justify-between gap-2 rounded-lg border px-2 py-2 text-[11px] font-medium transition ${
                                  selectedSymbol === symbol.id
                                    ? 'border-sky-400 bg-sky-50 text-sky-700 ring-2 ring-sky-100'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'
                                }`}
                                onClick={() => setSelectedSymbol(symbol.id)}
                              >
                                <span className="flex h-9 w-full items-center justify-center overflow-hidden rounded-md bg-slate-50">
                                  {renderSymbolPreview(symbol, symbolColor, symbol.spanColumns > 4 ? 10 : 16)}
                                </span>
                                <span className="w-full wrap-break-word text-center leading-tight">{symbol.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="text-xs font-semibold text-slate-600">커스텀 알파벳 브러시</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={3}
                        className={`${inputClassName} min-w-0 flex-1`}
                        value={alphabetSymbolDraft}
                        onChange={(event) => setAlphabetSymbolDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') {
                            return;
                          }

                          event.preventDefault();
                          addAlphabetSymbol();
                        }}
                        placeholder="ABC"
                      />
                      <button type="button" className={buttonClassName} onClick={addAlphabetSymbol}>
                        기호 추가
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                      {customSymbols.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {customSymbols.map((symbol) => (
                            <button
                              key={symbol.id}
                              type="button"
                              title={symbol.label}
                              className={`flex min-h-16 flex-col items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                                selectedSymbol === symbol.id
                                  ? 'border-sky-400 bg-sky-50 text-sky-700 ring-2 ring-sky-100'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'
                              }`}
                              onClick={() => setSelectedSymbol(symbol.id)}
                              onContextMenu={(event: MouseEvent<HTMLButtonElement>) => {
                                event.preventDefault();
                                openCustomSymbolMenu(symbol.id, event.clientX, event.clientY);
                              }}
                              onTouchStart={(event: TouchEvent<HTMLButtonElement>) => {
                                const touch = event.touches[0];

                                clearLongPressTimer();
                                longPressTimerRef.current = setTimeout(() => {
                                  openCustomSymbolMenu(symbol.id, touch.clientX, touch.clientY);
                                }, 450);
                              }}
                              onTouchMove={clearLongPressTimer}
                              onTouchEnd={clearLongPressTimer}
                              onTouchCancel={clearLongPressTimer}
                            >
                              {renderSymbolPreview(symbol, symbolColor, 24)}
                              <span>{symbol.label}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                          추가한 알파벳 브러시가 없습니다.
                        </div>
                      )}
                    </div>
                    {customSymbolMenu && contextCustomSymbol ? (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-10 cursor-default"
                          aria-label="커스텀 브러시 메뉴 닫기"
                          onClick={() => setCustomSymbolMenu(null)}
                        />
                        <div
                          ref={customSymbolMenuRef}
                          className="fixed z-20 flex w-48 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
                          style={{
                            left: customSymbolMenu.x,
                            top: customSymbolMenu.y,
                          }}
                          onClick={(event) => event.stopPropagation()}
                          onContextMenu={(event) => event.preventDefault()}
                          onTouchStart={(event) => event.stopPropagation()}
                          onTouchMove={(event) => event.stopPropagation()}
                          onTouchEnd={(event) => event.stopPropagation()}
                        >
                          <div className="border-b border-slate-100 pb-2">
                            <p className="text-sm font-semibold text-slate-700">{contextCustomSymbol.label}</p>
                            <p className="text-xs text-slate-500">커스텀 알파벳 브러시</p>
                          </div>
                          <button
                            type="button"
                            className={`${contextMenuClassName} text-rose-600 hover:bg-rose-100 hover:text-rose-600`}
                            onClick={() => {
                              deleteCustomSymbol(contextCustomSymbol.id);
                              setCustomSymbolMenu(null);
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                  <div className="flex min-h-4 min-w-4 items-center justify-center overflow-auto rounded-md border border-slate-200 p-1">
                    {renderSymbolPreview(selectedSymbolOption, symbolColor)}
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <label className="flex flex-col gap-2 text-xs text-slate-600">
                      기호 색상
                      <input type="color" value={symbolColor} onChange={(event) => setSymbolColor(event.target.value)} />
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold text-slate-500">최근 사용 색상</p>
                  <ColorHistorySwatches colors={colorHistory} onSelect={setSymbolColor} />
                </div>
              </div>
            ) : null}

            {panelMode === 'background-brush' ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-700">배경 채우기 브러시</p>
                <label className="flex flex-col gap-2 text-xs text-slate-600">
                  배경 색상
                  <input type="color" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} />
                </label>
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold text-slate-500">최근 사용 색상</p>
                  <ColorHistorySwatches colors={colorHistory} onSelect={setBackgroundColor} />
                </div>
              </div>
            ) : null}

            {panelMode === 'eraser' ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-700">지우개</p>
                <select
                  className={inputClassName}
                  value={eraserMode}
                  onChange={(event) => setEraserMode(event.target.value as 'symbol' | 'background' | 'area' | 'all')}
                >
                  <option value="all">기호+배경 지우기</option>
                  <option value="symbol">기호 지우기</option>
                  <option value="background">배경 지우기</option>
                </select>
              </div>
            ) : null}

            {panelMode === 'fill' ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-700">영역 채우기</p>
                <select
                  className={inputClassName}
                  value={fillMode}
                  onChange={(event) => setFillMode(event.target.value as 'symbol' | 'background')}
                >
                  <option value="symbol">기호 채우기</option>
                  <option value="background">배경만 채우기</option>
                </select>
                <label className="flex flex-col gap-2 text-xs text-slate-600">
                  현재 색상
                  <input
                    type="color"
                    value={fillMode === 'symbol' ? symbolColor : backgroundColor}
                    onChange={(event) =>
                      fillMode === 'symbol'
                        ? setSymbolColor(event.target.value)
                        : setBackgroundColor(event.target.value)
                    }
                  />
                </label>
              </div>
            ) : null}

            {panelMode === 'selection' ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-700">선택 / 이동</p>
                <p className="text-xs leading-5 text-slate-500">
                  현재는 사각형 영역만 선택할 수 있습니다. 추가 설정은 아직 제공되지 않습니다.
                </p>
              </div>
            ) : null}

            {panelMode === 'none' ? (
              <div className="text-sm text-slate-500">선택한 도구에 추가 설정이 없습니다.</div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageLayerImport}
            />
          </section>

          <hr className="border-b-slate-200" />

          <section>
            <div className="flex items-center justify-between">
              <h2 className={panelSecionTitleClassName}>레이어</h2>
              <div className="flex gap-2">
                <button type="button" className={buttonClassName} onClick={addDrawingLayer}>
                  새 레이어
                </button>
                <button type="button" className={buttonClassName} onClick={() => fileInputRef.current?.click()}>
                  이미지 레이어
                </button>
              </div>
            </div>

            <LayerStackArea
              layers={layers}
              activeLayerId={activeLayerId}
              setActiveLayer={setActiveLayer}
              moveLayer={moveLayer}
              toggleLayerVisibility={toggleLayerVisibility}
              setLayerOpacity={setLayerOpacity}
              renameLayer={renameLayer}
              clearDrawingLayer={clearDrawingLayer}
              deleteLayer={deleteLayer}
              duplicateLayer={duplicateLayer}
              mergeLayerDown={mergeLayerDown}
              fitImageLayerToCanvas={fitImageLayerToCanvas}
              setImageLayerSize={setImageLayerSize}
            />
          </section>
        </>
      )}
    </aside>
  );
}
