"use client";
import { useSyncStatus } from "./SyncProvider";
import { hasSupabase } from "@/lib/supabase";

const STATUS_COLOR: Record<string, string> = {
  idle:    "var(--text-dim)",
  syncing: "var(--amber)",
  synced:  "var(--lime)",
  error:   "var(--pink)",
  offline: "var(--text-dim)",
};

const STATUS_LABEL: Record<string, string> = {
  idle:    "local only",
  syncing: "syncing…",
  synced:  "synced",
  error:   "sync error",
  offline: "offline",
};

export default function SyncDot({ showLabel = false }: { showLabel?: boolean }) {
  const { status } = useSyncStatus();

  if (!hasSupabase) return null; // Don't show at all if no Supabase

  const color = STATUS_COLOR[status] ?? "var(--text-dim)";
  const isPulsing = status === "syncing";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div
        className={isPulsing ? "animate-pulse-slow" : ""}
        style={{
          width: 7, height: 7, borderRadius: "50%",
          background: color,
          boxShadow: status === "synced" ? `0 0 6px ${color}` : "none",
          transition: "background 0.3s",
          flexShrink: 0,
        }}
      />
      {showLabel && (
        <span style={{ fontSize: 10, color, fontWeight: 600 }}>
          {STATUS_LABEL[status]}
        </span>
      )}
    </div>
  );
}
