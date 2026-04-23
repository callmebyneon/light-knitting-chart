export type KnitIconCore = {
  id: string;
  label: string;
  kind: 'svg' | 'alphabet';
  text: string;
  spanColumns: number;
  spanRows: number;
  pathData?: string;
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
