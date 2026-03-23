"use client";
import { useMemo } from "react";
import { UserProfile, EnergyZone } from "@/lib/store";

interface Props {
  profile: UserProfile;
}

const ZONE_COLOR: Record<EnergyZone, string> = {
  peak: "var(--lime)",
  active: "var(--cyan)",
  low: "var(--amber)",
  rest: "var(--purple)",
};

const ZONE_LABEL: Record<EnergyZone, string> = {
  peak: "peak",
  active: "active",
  low: "low",
  rest: "rest",
};

function getZone(hour: number, profile: UserProfile): EnergyZone {
  const wake = parseInt(profile.wakeTime.split(":")[0]);
  const bed = parseInt(profile.bedTime.split(":")[0]);
  const buffer = bed - Math.ceil(profile.bufferMinutes / 60);
  const peaks = profile.energyProfile.peakHours;

  if (hour < wake || hour >= bed) return "rest";
  if (hour >= buffer) return "rest";
  if (peaks.includes(hour)) return "peak";
  if (hour >= wake && hour < wake + 2) return "low"; // grogginess window
  if (profile.energyProfile.morningPerson) {
    if (hour >= 13 && hour <= 14) return "low"; // afternoon dip
    if (hour >= 20) return "low";
  } else {
    if (hour >= 9 && hour <= 10) return "low";
    if (hour >= 13 && hour <= 14) return "low";
  }
  return "active";
}

export default function EnergyForecast({ profile }: Props) {
  const now = new Date().getHours();
  const wake = parseInt(profile.wakeTime.split(":")[0]);
  const bed = parseInt(profile.bedTime.split(":")[0]);

  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      zone: getZone(h, profile),
      isCurrent: h === now,
      isActive: h >= wake && h < bed,
    }));
  }, [profile, now, wake, bed]);

  const activeHours = hours.filter((h) => h.isActive);
  const peakHours = hours.filter((h) => h.zone === "peak");
  const currentZone = hours[now]?.zone;

  function fmt(h: number) {
    if (h === 0) return "12a";
    if (h === 12) return "12p";
    return h < 12 ? `${h}a` : `${h - 12}p`;
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "18px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, marginBottom: 2 }}>
            energy forecast
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            now: <span style={{ color: ZONE_COLOR[currentZone], fontWeight: 700 }}>{ZONE_LABEL[currentZone]}</span>
            {peakHours.length > 0 && (
              <span style={{ marginLeft: 8 }}>
                · peak at <span style={{ color: "var(--lime)", fontWeight: 600 }}>{fmt(peakHours[0].hour)}</span>
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 22 }}>
          {currentZone === "peak" ? "⚡" : currentZone === "active" ? "🟢" : currentZone === "low" ? "🌿" : "🌙"}
        </div>
      </div>

      {/* Bar chart — show active hours only */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 48, marginBottom: 6 }}>
        {hours.map(({ hour, zone, isCurrent, isActive }) => {
          const heights: Record<EnergyZone, number> = { peak: 48, active: 32, low: 18, rest: 8 };
          const h = heights[zone];
          const color = ZONE_COLOR[zone];
          return (
            <div key={hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{
                width: "100%",
                height: h,
                background: isActive ? color : "var(--surface2)",
                borderRadius: "3px 3px 0 0",
                opacity: isActive ? (isCurrent ? 1 : 0.65) : 0.3,
                boxShadow: isCurrent ? `0 0 8px ${color}` : "none",
                transition: "height 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                border: isCurrent ? `1px solid ${color}` : "none",
              }} />
            </div>
          );
        })}
      </div>

      {/* Hour labels - sparse */}
      <div style={{ display: "flex", position: "relative", height: 14 }}>
        {[0, 6, 9, 12, 15, 18, 21].map((h) => (
          <div key={h} style={{
            position: "absolute",
            left: `${(h / 24) * 100}%`,
            transform: "translateX(-50%)",
            fontSize: 9,
            color: h === now ? "var(--lime)" : "var(--text-dim)",
            fontWeight: h === now ? 700 : 400,
          }}>
            {fmt(h)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
        {(["peak", "active", "low", "rest"] as EnergyZone[]).map((z) => (
          <div key={z} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: ZONE_COLOR[z] }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{z}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
