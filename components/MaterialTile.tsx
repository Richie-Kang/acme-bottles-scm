import { Material } from "@prisma/client";
import { MATERIAL_LABEL } from "@/lib/constants";
import { formatQty } from "@/lib/format";

export default function MaterialTile({
  material,
  receivedKg,
  inTransitKg,
  inTransitCount,
}: {
  material: Material;
  receivedKg: number;
  inTransitKg: number;
  inTransitCount: number;
}) {
  return (
    <div
      className="backdrop-blur-xl border border-white/15 rounded-2xl shadow-glass p-5 flex-1 min-w-[200px]"
      style={{ background: "rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-2 text-white/60 text-sm">
        <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-xs">⬡</span>
        <span>{MATERIAL_LABEL[material]}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white">{formatQty(receivedKg)}</span>
        <span className="text-white/55 text-sm">kg total</span>
      </div>
      {inTransitCount > 0 ? (
        <div className="text-xs text-amber-300 mt-1">
          {inTransitCount} order{inTransitCount === 1 ? "" : "s"} in transit · {formatQty(inTransitKg)} kg
        </div>
      ) : (
        <div className="text-xs text-white/40 mt-1">no incoming</div>
      )}
    </div>
  );
}
