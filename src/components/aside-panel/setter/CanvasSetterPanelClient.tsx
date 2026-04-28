'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PanelLeftOpen } from 'lucide-react';

import { iconButtonClassName, inputClassName, panelSecionTitleClassName, panelSectionClassName, panelShellClassName, primaryButtonClassName } from '@/components/ui/sharedStyles';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useCanvasTool } from '@/stores/useCanvasTool';
import { ResizeOrigin } from '@/types/canvas';

const RESIZE_ORIGIN_BUTTONS: Array<{ origin: ResizeOrigin; arrow: string }> = [
  { origin: 'top-left', arrow: '↖' },
  { origin: 'top', arrow: '↑' },
  { origin: 'top-right', arrow: '↗' },
  { origin: 'left', arrow: '←' },
  { origin: 'center', arrow: '□' },
  { origin: 'right', arrow: '→' },
  { origin: 'bottom-left', arrow: '↙' },
  { origin: 'bottom', arrow: '↓' },
  { origin: 'bottom-right', arrow: '↘' },
];
const ROWS_AND_COLUMNS_MAXIMUM = 100;

export default function CanvasSetterPanelClient() {
  const { createCanvas, resizeCanvas, hasCanvas, rows, stiches, resizeOrigin, setResizeOrigin } = useCanvasStore();
  const { isPortraitViewport, isLeftPanelOpen, toggleLeftPanel } = useCanvasTool();
  const [inputColumns, setInputColumns] = useState(String(stiches));
  const [inputRows, setInputRows] = useState(String(rows));
  const parsedColumns = Number.parseInt(inputColumns, 10);
  const parsedRows = Number.parseInt(inputRows, 10);
  const isInvalid =
    !Number.isInteger(parsedColumns) ||
    !Number.isInteger(parsedRows) ||
    parsedColumns <= 0 ||
    parsedRows <= 0 ||
    parsedColumns > ROWS_AND_COLUMNS_MAXIMUM ||
    parsedRows > ROWS_AND_COLUMNS_MAXIMUM;
  const isCollapsed = isPortraitViewport && !isLeftPanelOpen;

  useEffect(() => {
    if (String(rows) !== inputRows) {
      setInputRows(String(rows))
    }
  }, [rows])
  useEffect(() => {
    if (String(stiches) !== inputColumns) {
      setInputColumns(String(stiches))
    }
  }, [stiches])
  
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    if (!hasCanvas) {
      createCanvas(parsedRows, parsedColumns);
      return;
    }

    if (
      (parsedColumns < stiches || parsedRows < rows) &&
      !window.confirm('캔버스가 줄어들면 작업 내용 일부가 잘릴 수 있습니다. 계속 자를까요?')
    ) {
      return;
    }

    resizeCanvas(parsedRows, parsedColumns, resizeOrigin);
  }

  return (
    <aside
      className={`${panelShellClassName} border-r transition-[width] duration-200 ${isCollapsed ? 'w-15' : 'w-60 p-3'}`}
    >
      {isCollapsed ? (
        <div className="flex h-full items-start justify-center pt-4">
          <button type="button" className={iconButtonClassName} onClick={toggleLeftPanel} aria-label="왼쪽 패널 열기">
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className={panelSecionTitleClassName}>사이즈 조절</h2>
            {isPortraitViewport ? (
              <button type="button" className={iconButtonClassName} onClick={toggleLeftPanel} aria-label="왼쪽 패널 접기">
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <section className={panelSectionClassName}>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  코
                  <input
                    min="1"
                    max={ROWS_AND_COLUMNS_MAXIMUM}
                    step="1"
                    name="stiches"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={inputClassName}
                    value={inputColumns}
                    onInput={(event) => setInputColumns(event.currentTarget.value)}
                    placeholder={`1~${ROWS_AND_COLUMNS_MAXIMUM}`}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  단
                  <input
                    min="1"
                    max={ROWS_AND_COLUMNS_MAXIMUM}
                    step="1"
                    name="rows"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={inputClassName}
                    value={inputRows}
                    onInput={(event) => setInputRows(event.currentTarget.value)}
                    placeholder={`1~${ROWS_AND_COLUMNS_MAXIMUM}`}
                  />
                </label>
              </div>
            </section>

            <section className={panelSectionClassName}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">확장/자르기 기준점</p>
              </div>
              <div className="grid grid-cols-3 w-33 mx-auto">
                {RESIZE_ORIGIN_BUTTONS.map((button) => (
                  <button
                    key={button.origin}
                    type="button"
                    aria-label={button.origin}
                    className={`flex h-11 items-center justify-center border text-lg transition ${
                      resizeOrigin === button.origin
                        ? 'border-sky-400 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-sky-300'
                    }`}
                    onClick={() => setResizeOrigin(button.origin)}
                  >
                  </button>
                ))}
              </div>
            </section>

            <button type="submit" disabled={isInvalid} className={primaryButtonClassName}>
              사이즈 적용
            </button>
          </form>

          <div className={`${panelSectionClassName} mt-4`}>
            <p className="text-sm text-slate-600">
              현재 캔버스: {stiches}코 x {rows}단
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
