'use client';

type ColorHistorySwatchesProps = {
  colors: string[];
  onSelect: (color: string) => void;
};

export default function ColorHistorySwatches({ colors, onSelect }: ColorHistorySwatchesProps) {
  if (colors.length === 0) {
    return (
      <div className="rounded-md bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
        아직 사용한 색상이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className="flex items-center rounded-md border border-slate-200 bg-white px-2 py-2 text-left text-xs text-slate-600 transition hover:border-sky-300 hover:text-sky-700"
          onClick={() => onSelect(color)}
          title={color}
        >
          <span className="h-5 w-5 shrink-0 rounded border border-slate-200" style={{ backgroundColor: color }} />
          <span className="truncate font-mono">{color}</span>
        </button>
      ))}
    </div>
  );
}
