export type KnitIconCore = {
  id: string;
  label: string;
  kind: 'svg' | 'alphabet';
  spanColumns: number;
  spanRows: number;
  pathData?: string;
  fillRule?: string;
};

export type CanvasSymbolRenderer = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  text: string,
) => void;

export type CanvasSymbolOption = KnitIconCore & {
  draw: CanvasSymbolRenderer;
};
