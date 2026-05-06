"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/production", label: "Production Status", icon: "▤" },
  { href: "/orders", label: "Purchase Orders", icon: "▦" },
  { href: "/supplies", label: "Supplies", icon: "▥" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 p-4 hidden md:block">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-glass p-5 sticky top-4">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">A</div>
          <div>
            <div className="font-semibold leading-tight">ACME Bottles</div>
            <div className="text-xs text-white/60">Production Manager</div>
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2 px-2">Dashboard</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition",
                  active
                    ? "bg-white/15 border border-white/15 text-white shadow-inner"
                    : "text-white/70 hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                <span className="text-base opacity-80">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
