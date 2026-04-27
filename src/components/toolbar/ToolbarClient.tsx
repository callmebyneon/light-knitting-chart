'use client';

import Modal from '@/components/ui/widgets/Modal';
import ToolbarButton from '@/components/toolbar/ToolbarButton';
import { inputClassName, primaryButtonClassName, toolbarButtonClassName } from '@/components/ui/sharedStyles';
import { toolbarGroups, useCanvasTool } from '@/stores/useCanvasTool';
import { useCanvasStore } from '@/stores/useCanvasStore';

export default function ToolbarClient() {
  const {
    activeToolId,
    activateTool,
    requestSave,
    closeSaveModal,
    confirmSave,
    isSaveModalOpen,
    saveIncludeGrid,
    saveIncludeAxisLabels,
    setSaveIncludeGrid,
    setSaveIncludeAxisLabels,
    zoomIn,
    zoomOut,
  } = useCanvasTool();
  const { undo, redo } = useCanvasStore();
  const visibleToolbarGroups = toolbarGroups.filter((group) => group.id !== 'history');

  return (
    <>
      <nav className="fixed left-0 top-12 flex h-11 w-full items-center overflow-x-auto bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.08)]">
        {visibleToolbarGroups.map((group, groupIndex) => (
          <div key={group.id} className="flex items-center">
            {group.buttons.map((button) => (
              <ToolbarButton
                key={button.id}
                button={button}
                className={`${toolbarButtonClassName} ${
                  activeToolId === button.id
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                onClick={() => {
                  if (button.action === 'activate') {
                    activateTool(button);
                    return;
                  }

                  if (button.action === 'save') {
                    requestSave();
                    return;
                  }

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
            ))}
            {groupIndex < visibleToolbarGroups.length - 1 ? <div className="mx-2 h-5 w-px bg-slate-200" /> : null}
          </div>
        ))}
      </nav>

      <Modal isOpen={isSaveModalOpen} title="이미지 저장 옵션" onClose={closeSaveModal}>
        <div className="flex flex-col gap-4">
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className={`${inputClassName} mt-0.5 h-4 w-4 rounded border-slate-300 p-0 accent-sky-700`}
              checked={saveIncludeGrid}
              onChange={(event) => setSaveIncludeGrid(event.target.checked)}
            />
            <div className="space-y-1">
              <p className="font-medium">그리드 포함</p>
              <p className="text-xs text-slate-500">셀 경계선과 10칸 강조선을 함께 저장합니다.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className={`${inputClassName} mt-0.5 h-4 w-4 rounded border-slate-300 p-0 accent-sky-700`}
              checked={saveIncludeAxisLabels}
              onChange={(event) => setSaveIncludeAxisLabels(event.target.checked)}
            />
            <div className="space-y-1">
              <p className="font-medium">코/단 수 표시 포함</p>
              <p className="text-xs text-slate-500">왼쪽 단 수와 아래쪽 코 수를 함께 이미지에 넣습니다.</p>
            </div>
          </label>

          <button type="button" className={primaryButtonClassName} onClick={confirmSave}>
            이미지로 저장
          </button>
        </div>
      </Modal>
    </>
  );
}
