"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Zap, BarChart2, Settings } from "lucide-react";
import SyncDot from "./SyncDot";

const NAV = [
  { href: "/dashboard",  icon: Home,        label: "home"     },
  { href: "/tasks",      icon: CheckSquare, label: "quests"   },
  { href: "/habits",     icon: Zap,         label: "habits"   },
  { href: "/reflection", icon: BarChart2,   label: "reflect"  },
  { href: "/settings",   icon: Settings,    label: "settings" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(10,10,15,0.97)",
      backdropFilter: "blur(20px)",
      /* spec §4: bottom nav border-top 1px solid rgba(255,255,255,0.06) */
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex", zIndex: 100,
      /* spec §4: bottom nav height ~52px */
      height: 52,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = path.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textDecoration: "none", gap: 3, position: "relative",
            color: active ? "var(--lime)" : "var(--text-muted)",
            transition: "color 0.2s",
          }}>
            {/* spec §5.1: icon 13px */}
            <Icon size={13} style={{ filter: active ? "drop-shadow(0 0 5px var(--lime))" : "none", transition: "filter 0.2s" }} />
            {/* spec §5.1: label 8px */}
            <span style={{ fontSize: 8, fontWeight: active ? 600 : 400, letterSpacing: 0.2 }}>{label}</span>
            {label === "settings" && (
              <div style={{ position: "absolute", top: 8, right: "calc(50% - 14px)" }}>
                <SyncDot />
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
