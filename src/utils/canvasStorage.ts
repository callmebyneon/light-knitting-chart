export const canvasStorageKeys = {
  latestSnapshot: 'light-knitting-chart:latest',
  latestImage: 'light-knitting-chart:latest-image',
} as const;

export function clearCanvasState() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(canvasStorageKeys.latestSnapshot);
  localStorage.removeItem(canvasStorageKeys.latestImage);
}
