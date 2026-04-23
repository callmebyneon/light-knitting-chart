import type { CanvasToolDefinition } from '@/stores/useCanvasTool';
import { ZoomIn, ZoomOut } from 'lucide-react';

type ToolbarButtonProps = {
  button: CanvasToolDefinition;
  className: string;
  onClick: () => void;
};

export default function ToolbarButton({ button, className, onClick }: ToolbarButtonProps) {
  const tooltip = button.shortcut
    ? `${button.description} (${button.shortcut.label})`
    : button.description;

  return (
    <button type="button" className={className} title={tooltip} aria-label={tooltip} onClick={onClick}>
      {button.label === '+' ? <ZoomIn size={16} /> : button.label === '-' ? <ZoomOut size={16} /> : button.label}
    </button>
  );
}
