import Canvas from '@/components/canvas/Canvas';
import CanvasSetterPanel from '@/components/aside-panel/setter/CanvasSetterPanel';
import CanvasToolWindowPanel from '@/components/aside-panel/tool/CanvasToolWindowPanel';
import CanvasViewportEffects from '@/components/canvas/CanvasViewportEffects';
import TitleArea from '@/components/toolbar/TitleArea';
import Toolbar from '@/components/toolbar/Toolbar';
import ToolIsland from '../tool-island/ToolIsland';

export default function CanvasArea() {
  return (
    <>
      <CanvasViewportEffects />
      <TitleArea />
      <Toolbar />
      <main className="grid h-[calc(100lvh-44px)] lg:h-lvh w-full grid-cols-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#f5f5f5] text-slate-900">
        <CanvasSetterPanel />
        <Canvas />
        <ToolIsland />
        <CanvasToolWindowPanel />
      </main>
    </>
  );
}
