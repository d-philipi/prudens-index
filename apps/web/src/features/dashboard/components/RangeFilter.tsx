'use client';

interface Props {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel: (min: number, max: number) => string;
}

export function RangeFilter({ label, min, max, value, onChange, formatLabel }: Props) {
  const [lo, hi] = value;
  const degenerate = min >= max;

  const setLo = (next: number) => {
    onChange([Math.min(next, hi), hi]);
  };
  const setHi = (next: number) => {
    onChange([lo, Math.max(next, lo)]);
  };

  return (
    <div className="min-w-0 flex-1">
      <label className="mb-1 block text-xs font-medium text-brand">{label}</label>
      {degenerate ? (
        <p className="text-xs text-text-subtitle">{formatLabel(min, max)}</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={min}
              max={max}
              value={lo}
              disabled={degenerate}
              onChange={(e) => setLo(Number(e.target.value))}
              className="w-full"
            />
            <input
              type="range"
              min={min}
              max={max}
              value={hi}
              disabled={degenerate}
              onChange={(e) => setHi(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <p className="mt-1 text-xs text-text-subtitle">{formatLabel(lo, hi)}</p>
        </>
      )}
    </div>
  );
}
