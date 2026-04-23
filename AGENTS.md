<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- Naming rules:
  - Constant variables for specific data: Use 'UPPERCASE_WITH_SNAKE_CASE'. (example: `const SYMBOL_PREVIEW_CELL_SIZE = 24;`)
  - Component name: Use 'PascalCase'. (example: `CanvasArea`)
  - Component file name: Use 'PascalCase'. (example: `CanvasArea.tsx`)
  - Others file name: Like stores or utility functions, use 'camelCase'. (example: `useCanvasStore.ts`)
  - folder name: Use 'kebab-case'. (example: `knit-icons`)
- Default UI target is tablet use.
  - Treat tablet landscape as the primary layout baseline.
  - When showing the chart canvas, keep the whole canvas visible in the center of `CanvasArea` by default.
  - Touch interactions should be considered first-class, including two-finger pinch zoom on the canvas.
- Use light mode only. Do not add or keep `dark:*` Tailwind classes.
- Do not create small helper methods that are referenced only once.
