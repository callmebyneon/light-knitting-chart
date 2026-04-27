import type { CanvasToolDefinition } from '@/stores/useCanvasTool';

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
      {button.label}
    </button>
  );
}
