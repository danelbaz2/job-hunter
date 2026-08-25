export function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 text-sm text-text/85">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-neutral-800">
        <div
          className="h-full rounded-pill bg-accent-500 transition-[width] duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm text-text/70">{value}%</span>
    </div>
  );
}
