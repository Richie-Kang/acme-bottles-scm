import { ReactNode } from "react";

export default function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "backdrop-blur-xl bg-white/8 border border-white/12 rounded-2xl shadow-glass",
        className,
      ].join(" ")}
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      {children}
    </div>
  );
}
