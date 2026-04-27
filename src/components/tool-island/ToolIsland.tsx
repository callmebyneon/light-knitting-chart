'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Fullscreen, Grid3x3, Hand, Redo2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';

import IconButton from '@/components/ui/widgets/IconButton';
import { inputClassName } from '@/components/ui/sharedStyles';
import { toolbarGroups, useCanvasTool } from '@/stores/useCanvasTool';
import { useCanvasStore } from '@/stores/useCanvasStore';

const ICON_LABEL: Record<string, ReactNode> = {
  실행취소: <Undo2 size={16} />,
  다시실행: <Redo2 size={16} />,
  '+': <ZoomIn size={16} />,
  '-': <ZoomOut size={16} />,
};

export default function ToolIsland() {
  const {
    activeToolId,
    zoom,
    zoomIn,
    zoomOut,
    setZoom,
    resetZoom,
    activatePanMode,
    isGridVisible,
    toggleGridVisibility,
  } = useCanvasTool();
  const { undo, redo } = useCanvasStore();
  const historyGroup = useMemo(
    () => toolbarGroups.find((group) => group.id === 'history') ?? { id: 'history', buttons: [] },
    [],
  );
  const [zoomInput, setZoomInput] = useState(() => (zoom * 100).toFixed(0));
  const [isEditingZoomInput, setIsEditingZoomInput] = useState(false);

  function commitZoomInput() {
    const nextZoomPercent = Number.parseFloat(zoomInput);

    if (Number.isNaN(nextZoomPercent)) {
      setZoomInput((zoom * 100).toFixed(0));
      return;
    }

    const normalizedZoom = Math.min(600, Math.max(40, nextZoomPercent)) / 100;

    setZoom(normalizedZoom);
    setZoomInput((normalizedZoom * 100).toFixed(0));
  }

  return (
    <section className="pointer-events-none fixed bottom-4 left-1/2 z-20 -translate-x-1/2">
      <div className="pointer-events-auto flex h-11 min-w-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        {historyGroup.buttons.map((button, buttonIndex) => {
          const tooltip = button.shortcut
            ? `${button.description} (${button.shortcut.label})`
            : button.description;

          return (
            <div key={button.id} className="flex items-center">
              <IconButton
                icon={ICON_LABEL[button.label] ?? button.label}
                label={tooltip}
                title={tooltip}
                onClick={() => {
                  if (button.action === 'undo') {
                    undo();
                    return;
                  }

                  if (button.action === 'redo') {
                    redo();
                    return;
                  }

                  if (button.action === 'zoom-in') {
                    zoomIn();
                    return;
                  }

                  zoomOut();
                }}
              />
              {buttonIndex === 1 ? <div className="mx-1 h-5 w-px bg-slate-200" /> : null}
            </div>
          );
        })}

        <label className="ml-1 flex items-center gap-1 text-xs text-slate-500">
          <input
            type="text"
            inputMode="numeric"
            aria-label="줌 비율"
            className={`${inputClassName} h-8 w-16 px-2 py-1 text-center font-semibold`}
            value={isEditingZoomInput ? zoomInput : (zoom * 100).toFixed(0)}
            onChange={(event) => setZoomInput(event.target.value.replace(/[^0-9.]/g, ''))}
            onFocus={() => {
              setIsEditingZoomInput(true);
              setZoomInput((zoom * 100).toFixed(0));
            }}
            onBlur={() => {
              commitZoomInput();
              setIsEditingZoomInput(false);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') {
                return;
              }

              event.preventDefault();
              commitZoomInput();
              setIsEditingZoomInput(false);
              event.currentTarget.blur();
            }}
          />
          <span>%</span>
        </label>

        <div className="mx-1 h-5 w-px bg-slate-200" />

        <IconButton
          icon={<Fullscreen className="h-4 w-4" />}
          label="줌을 100%로 맞추기"
          title="줌을 100%로 맞춥니다."
          onClick={resetZoom}
        />
        <IconButton
          icon={<Hand className="h-4 w-4" />}
          label="화면 이동 모드"
          title="화면 이동 모드"
          isActive={activeToolId === 'pan'}
          onClick={activatePanMode}
        />
        <IconButton
          icon={<Grid3x3 className="h-4 w-4" />}
          label="그리드 표시 토글"
          title={isGridVisible ? '그리드를 숨깁니다.' : '그리드를 표시합니다.'}
          isActive={isGridVisible}
          onClick={toggleGridVisibility}
        />
      </div>
    </section>
  );
}
