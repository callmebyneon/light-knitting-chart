import Canvas from '@/components/canvas/Canvas';
import CanvasSetterPanel from '@/components/aside-panel/setter/CanvasSetterPanel';
import CanvasToolWindowPanel from '@/components/aside-panel/tool/CanvasToolWindowPanel';
import CanvasViewportEffects from '@/components/canvas/CanvasViewportEffects';
import TitleArea from '@/components/toolbar/TitleArea';
import Toolbar from '@/components/toolbar/Toolbar';

export default function CanvasArea() {
  return (
    <div className="h-screen w-full overflow-hidden text-sm">
      <CanvasViewportEffects />
      <TitleArea />
      <Toolbar />
      <main className="mt-23 grid h-[calc(100vh-92px)] w-full grid-cols-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#f5f5f5] text-slate-900">
        <CanvasSetterPanel />
        <Canvas />
        <CanvasToolWindowPanel />
      </main>
    </div>
  );
}
