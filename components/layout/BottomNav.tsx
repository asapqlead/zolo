"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Zap, BarChart2, Settings } from "lucide-react";
import SyncDot from "./SyncDot";

const NAV = [
  { href: "/dashboard",  icon: Home,        label: "Home"     },
  { href: "/tasks",      icon: CheckSquare, label: "Quests"   },
  { href: "/habits",     icon: Zap,         label: "Habits"   },
  { href: "/reflection", icon: BarChart2,   label: "Reflect"  },
  { href: "/settings",   icon: Settings,    label: "Settings" },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(10,10,15,0.96)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid var(--border)",
      display: "flex", zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = path.startsWith(href);
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "10px 0 8px", gap: 4,
            textDecoration: "none",
            color: active ? "var(--lime)" : "var(--text-muted)",
            transition: "color 0.2s ease", position: "relative",
          }}>
            <Icon size={20} style={{
              filter: active ? "drop-shadow(0 0 6px var(--lime))" : "none",
              transition: "filter 0.2s",
            }} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
            {/* Sync dot on settings tab */}
            {label === "Settings" && (
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
