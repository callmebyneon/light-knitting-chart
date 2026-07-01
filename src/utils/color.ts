export const DEFAULT_GRID_COLOR = 'hsl(0 0% 67%)';

type HslColor = {
  h: number;
  s: number;
  l: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseHexChannel(value: string) {
  return Number.parseInt(value, 16);
}

function rgbToHsl(red: number, green: number, blue: number): HslColor {
  const normalizedRed = red / 255;
  const normalizedGreen = green / 255;
  const normalizedBlue = blue / 255;
  const max = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const min = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return {
      h: 0,
      s: 0,
      l: lightness * 100,
    };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (max === normalizedRed) {
    hue = ((normalizedGreen - normalizedBlue) / delta) % 6;
  } else if (max === normalizedGreen) {
    hue = (normalizedBlue - normalizedRed) / delta + 2;
  } else {
    hue = (normalizedRed - normalizedGreen) / delta + 4;
  }

  hue *= 60;

  if (hue < 0) {
    hue += 360;
  }

  return {
    h: hue,
    s: saturation * 100,
    l: lightness * 100,
  };
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = clamp(saturation / 100, 0, 1);
  const normalizedLightness = clamp(lightness / 100, 0, 1);
  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const intermediate = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const match = normalizedLightness - chroma / 2;

  if (normalizedHue < 60) {
    return [chroma, intermediate, 0].map((value) => Math.round((value + match) * 255));
  }

  if (normalizedHue < 120) {
    return [intermediate, chroma, 0].map((value) => Math.round((value + match) * 255));
  }

  if (normalizedHue < 180) {
    return [0, chroma, intermediate].map((value) => Math.round((value + match) * 255));
  }

  if (normalizedHue < 240) {
    return [0, intermediate, chroma].map((value) => Math.round((value + match) * 255));
  }

  if (normalizedHue < 300) {
    return [intermediate, 0, chroma].map((value) => Math.round((value + match) * 255));
  }

  return [chroma, 0, intermediate].map((value) => Math.round((value + match) * 255));
}

export function hexToHslColor(hexColor: string): HslColor | null {
  const normalizedHex = hexColor.trim().replace(/^#/, '');

  if (!/^[0-9a-fA-F]{3}$/.test(normalizedHex) && !/^[0-9a-fA-F]{6}$/.test(normalizedHex)) {
    return null;
  }

  const expandedHex =
    normalizedHex.length === 3
      ? normalizedHex
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : normalizedHex;

  const red = parseHexChannel(expandedHex.slice(0, 2));
  const green = parseHexChannel(expandedHex.slice(2, 4));
  const blue = parseHexChannel(expandedHex.slice(4, 6));

  return rgbToHsl(red, green, blue);
}

export function hexToHslString(hexColor: string): string | null {
  const hslColor = hexToHslColor(hexColor);

  if (!hslColor) {
    return null;
  }

  return `hsl(${Math.round(hslColor.h)} ${Math.round(hslColor.s)}% ${Math.round(hslColor.l)}%)`;
}

export function hslStringToHex(hslColor: string): string | null {
  const match = hslColor
    .trim()
    .match(/^hsl\(\s*(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)$/i);

  if (!match) {
    return null;
  }

  const [red, green, blue] = hslToRgb(Number(match[1]), Number(match[2]), Number(match[3]));

  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

export function shiftHslLightness(hslColor: string, delta: number): string {
  const match = hslColor
    .trim()
    .match(/^hsl\(\s*(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*\)$/i);

  if (!match) {
    return hslColor;
  }

  const hue = Number(match[1]);
  const saturation = Number(match[2]);
  const lightness = Number(match[3]);

  return `hsl(${Math.round(hue)} ${Math.round(saturation)}% ${Math.round(clamp(lightness + delta, 0, 100))}%)`;
}
