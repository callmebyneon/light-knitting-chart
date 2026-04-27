import type { ReactNode, SVGProps } from 'react';

import type { PlacedSymbol } from '@/types/canvas';

import type { CanvasSymbolOption, CanvasSymbolRenderer } from './canvasSymbolTypes';

const symbolPreviewCellSize = 16;
const symbolPathCellSize = 200;

export function createStrokeSymbolRenderer(
  drawPath: (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void,
  getLineWidth: (width: number, height: number) => number,
): CanvasSymbolRenderer {
  return (context, x, y, width, height, color) => {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = getLineWidth(width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    drawPath(context, x, y, width, height);
    context.stroke();
    context.restore();
  };
}

export function createPathSymbolRenderer(
  pathData: string,
  spanColumns: number,
  spanRows: number,
): CanvasSymbolRenderer {
  return (context, x, y, width, height, color) => {
    const path = new Path2D(pathData);

    context.save();
    context.translate(x, y);
    context.scale(width / (spanColumns * symbolPathCellSize), height / (spanRows * symbolPathCellSize));
    context.fillStyle = color;
    context.fill(path, 'evenodd');
    context.restore();
  };
}

export function createAlphabetSymbolRenderer(): CanvasSymbolRenderer {
  return (context, x, y, width, height, color, text) => {
    context.save();
    context.fillStyle = color;
    context.font = `${Math.max(8, Math.floor(Math.min(width, height) * 0.34))}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, x + width * 0.5, y + height * 0.53, width * 0.92);
    context.restore();
  };
}

export function renderSymbolPreview(
  option: CanvasSymbolOption,
  color: string,
  cellSize = symbolPreviewCellSize,
): ReactNode {
  if (option.kind === 'svg' && option.pathData) {
    const width = option.spanColumns * cellSize;
    const height = option.spanRows * cellSize;

    return (
      <svg
        aria-hidden="true"
        className="shrink-0"
        style={{ color, width, height }}
        viewBox={`0 0 ${option.spanColumns * symbolPathCellSize} ${option.spanRows * symbolPathCellSize}`}
      >
        <path d={option.pathData} fill="currentColor" fillRule={option.fillRule as SVGProps<SVGPathElement>["fillRule"] ?? "evenodd"} />
      </svg>
    );
  }

  return (
    <span className="text-xs font-semibold" style={{ color }}>
      {option.label}
    </span>
  );
}

export function drawPlacedSymbol(
  context: CanvasRenderingContext2D,
  symbol: PlacedSymbol,
  option: CanvasSymbolOption,
  cellSize: number,
) {
  option.draw(
    context,
    symbol.column * cellSize,
    symbol.row * cellSize,
    symbol.spanColumns * cellSize,
    symbol.spanRows * cellSize,
    symbol.symbolColor,
    symbol.symbolText,
  );
}
