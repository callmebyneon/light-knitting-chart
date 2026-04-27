'use client';

import Modal from '@/components/ui/widgets/Modal';
import ToolbarButton from '@/components/toolbar/ToolbarButton';
import { inputClassName, primaryButtonClassName, toolbarButtonClassName } from '@/components/ui/sharedStyles';
import { useColorHistory } from '@/stores/useColorHistory';
import { toolbarGroups, useCanvasTool } from '@/stores/useCanvasTool';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { clearCanvasSessionState } from '@/utils/canvasSessionStorage';

export default function ToolbarClient() {
  const {
    activeToolId,
    activateTool,
    requestSave,
    openNewCanvasModal,
    closeNewCanvasModal,
    confirmNewCanvasReset,
    closeSaveModal,
    confirmSave,
    isSaveModalOpen,
    isNewCanvasModalOpen,
    saveIncludeGrid,
    saveIncludeAxisLabels,
    setSaveIncludeGrid,
    setSaveIncludeAxisLabels,
    zoomIn,
    zoomOut,
  } = useCanvasTool();
  const {
    undo,
    redo,
    reset,
    selection,
    activeLayerId,
    layers,
    flipSelectionHorizontally,
    flipSelectionVertically,
    flipActiveLayerHorizontally,
    flipActiveLayerVertically,
  } = useCanvasStore();
  const clearColorHistory = useColorHistory((state) => state.clear);
  const visibleToolbarGroups = toolbarGroups.filter((group) => group.id !== 'history');
  const selectionMenuEnabled = Boolean(
    selection && layers.some((layer) => layer.id === activeLayerId && layer.type === 'drawing'),
  );

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
                  switch (button.action) {
                    case 'activate':
                      activateTool(button);
                      return;
                    case 'new-canvas':
                      openNewCanvasModal();
                      return;
                    case 'save':
                      requestSave();
                      return;
                    case 'undo':
                      undo();
                      return;
                    case 'redo':
                      redo();
                      return;
                    case 'flip-vertical':
                      if (selectionMenuEnabled) {
                        flipSelectionVertically();
                        return;
                      }
                      flipActiveLayerVertically();
                      return;
                    case 'flip-horizontal':
                      if (selectionMenuEnabled) {
                        flipSelectionHorizontally();
                        return;
                      }
                      flipActiveLayerHorizontally();
                      return;
                    case 'zoom-in':
                      zoomIn();
                      return;
                    case 'zoom-out':
                      zoomOut();
                      return;
                    default:
                      return;
                  }
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

      <Modal isOpen={isNewCanvasModalOpen} title="새 캔버스" onClose={closeNewCanvasModal}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">모든 작업 내용을 초기화하고 새 캔버스를 만들까요?</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={toolbarButtonClassName} onClick={closeNewCanvasModal}>
              취소
            </button>
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={() => {
                clearCanvasSessionState();
                clearColorHistory();
                reset();
                confirmNewCanvasReset();
              }}
            >
              초기화
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
