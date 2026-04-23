import knitIconsRegistry from '@/constants/knit-icons-registry.json';

import { createPathSymbolRenderer } from './canvasSymbolRenderers';
import type { CanvasSymbolOption } from './canvasSymbolTypes';

const defaultSymbolIds = knitIconsRegistry.map((icon) => icon.id);
const registryById = new Map(knitIconsRegistry.map((icon) => [icon.id, icon]));

export const defaultCanvasSymbolOptions: CanvasSymbolOption[] = defaultSymbolIds.map((id) => {
  const icon = registryById.get(id);

  if (!icon) {
    throw new Error(`Missing knit icon registry entry: ${id}`);
  }

  return {
    id: icon.id,
    label: icon.label,
    kind: 'svg',
    text: icon.text,
    spanColumns: icon.spanColumns,
    spanRows: icon.spanRows,
    pathData: icon.pathData,
    draw: createPathSymbolRenderer(icon.pathData, icon.spanColumns, icon.spanRows),
  };
});
