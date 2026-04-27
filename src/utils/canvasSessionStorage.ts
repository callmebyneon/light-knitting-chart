export const canvasSessionStorageKeys = {
  latestSnapshot: 'light-knitting-chart:latest',
  latestImage: 'light-knitting-chart:latest-image',
} as const;

export function clearCanvasSessionState() {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.removeItem(canvasSessionStorageKeys.latestSnapshot);
  sessionStorage.removeItem(canvasSessionStorageKeys.latestImage);
}
