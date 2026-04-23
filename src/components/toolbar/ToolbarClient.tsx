'use client';

import ToolbarButton from '@/components/toolbar/ToolbarButton';
import { toolbarButtonClassName } from '@/components/ui/sharedStyles';
import { toolbarGroups, useCanvasTool } from '@/stores/useCanvasTool';
import { useCanvasStore } from '@/stores/useCanvasStore';

export default function ToolbarClient() {
  const { activeToolId, activateTool, requestSave, zoom, zoomIn, zoomOut } = useCanvasTool();
  const { undo, redo } = useCanvasStore();

  return (
    <nav className="fixed left-0 top-12 flex h-11 w-full items-center overflow-x-auto bg-white px-3 shadow-[0_1px_0_rgba(15,23,42,0.08)]">
      {toolbarGroups.map((group, groupIndex) => (
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
          {groupIndex < toolbarGroups.length - 1 ? <div className="mx-2 h-5 w-px bg-slate-200" /> : null}
        </div>
      ))}
      <div className='px-3 text-slate-500'>{(zoom * 100).toFixed(0)}%</div>
    </nav>
  );
}
