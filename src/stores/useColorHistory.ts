'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_COLOR_HISTORY_LENGTH = 10;

function normalizeHexColor(color: string) {
  return color.trim().toUpperCase();
}

type ColorHistoryStore = {
  colors: string[];
  addColor: (color: string) => void;
};

export const useColorHistory = create<ColorHistoryStore>()(
  persist(
    (set) => ({
      colors: [],
      addColor: (color) =>
        set((state) => {
          const normalizedColor = normalizeHexColor(color);

          if (!normalizedColor) {
            return state;
          }

          return {
            colors: [
              normalizedColor,
              ...state.colors.filter((savedColor) => savedColor !== normalizedColor),
            ].slice(0, MAX_COLOR_HISTORY_LENGTH),
          };
        }),
    }),
    {
      name: 'light-knitting-chart:color-history',
    },
  ),
);
