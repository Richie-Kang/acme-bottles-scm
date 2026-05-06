import type { ScheduledPO } from "@/lib/types";
import { PRODUCT_LABEL } from "@/lib/constants";
import { formatDate, formatQty } from "@/lib/format";

export default function ProductionSlotCard({ po }: { po: ScheduledPO }) {
  return (
    <div
      className="backdrop-blur-xl border border-white/15 rounded-2xl shadow-glass p-5 flex-1 min-w-[300px]"
      style={{ background: "rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm font-bold">
          ▤
        </div>
        <div className="flex-1">
          <div className="text-indigo-200 font-medium">{po.poNumber}</div>
          <div className="font-semibold text-white">{po.customer}</div>
          <div className="text-xs text-white/65 mt-0.5">
            {PRODUCT_LABEL[po.product]} · {formatQty(po.quantity)} units
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-white/60">ETA:</span>
            <span className={po.lateDays > 0 ? "text-rose-300 font-medium" : "text-white"}>
              {formatDate(po.expectedEta)}
            </span>
            {po.lateDays > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-200 border border-rose-400/30">
                {po.lateDays}d overdue
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
