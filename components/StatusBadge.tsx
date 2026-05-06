import type { ScheduleStatus } from "@/lib/types";

const STYLES: Record<ScheduleStatus, string> = {
  Completed: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  "In Production": "bg-sky-500/20 text-sky-200 border-sky-400/30",
  Pending: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  "Delay expected": "bg-orange-500/25 text-orange-200 border-orange-400/30",
  "Unable to fulfill": "bg-red-500/25 text-red-200 border-red-400/30",
};

export default function StatusBadge({ status }: { status: ScheduleStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium whitespace-nowrap",
        STYLES[status],
      ].join(" ")}
    >
      {status}
    </span>
  );
}
