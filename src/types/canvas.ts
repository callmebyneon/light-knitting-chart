export type ResizeOrigin =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export type DrawingCell = {
  backgroundColor: string;
};

export type PlacedSymbol = {
  id: string;
  symbolId: string;
  symbolText: string;
  symbolColor: string;
  row: number;
  column: number;
  spanRows: number;
  spanColumns: number;
};

export type DrawingLayer = {
  id: string;
  type: 'drawing';
  name: string;
  visible: boolean;
  opacity: number;
  cells: DrawingCell[];
  placedSymbols: PlacedSymbol[];
};

export type ImageLayer = {
  id: string;
  type: 'image';
  name: string;
  visible: boolean;
  opacity: number;
  src: string;
  thumbnail: string;
  imageWidth: number;
  imageHeight: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

export type Layer = DrawingLayer | ImageLayer;

export type CanvasSnapshot = {
  title: string;
  rows: number;
  stiches: number;
  hasCanvas: boolean;
  resizeOrigin: ResizeOrigin;
  layers: Layer[];
  activeLayerId: string | null;
};
