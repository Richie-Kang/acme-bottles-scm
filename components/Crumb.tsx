export default function Crumb({ section }: { section: string }) {
  return (
    <div className="flex items-center justify-between mb-6 text-sm text-white/60">
      <div className="flex items-center gap-2">
        <span>ACME Bottles</span>
        <span className="opacity-50">›</span>
        <span className="text-white/85">{section}</span>
      </div>
      <span className="text-xs text-white/50">February 17, 2026</span>
    </div>
  );
}
