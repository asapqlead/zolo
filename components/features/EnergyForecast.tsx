"use client";
import { useMemo } from "react";
import { UserProfile, EnergyZone } from "@/lib/store";

interface Props { profile: UserProfile; }

function getZone(hour: number, profile: UserProfile): EnergyZone {
  const wake = parseInt(profile.wakeTime.split(":")[0]);
  const bed  = parseInt(profile.bedTime.split(":")[0]);
  const buffer = bed - Math.ceil(profile.bufferMinutes / 60);
  const peaks = profile.energyProfile.peakHours;
  if (hour < wake || hour >= bed) return "rest";
  if (hour >= buffer) return "rest";
  if (peaks.includes(hour)) return "peak";
  if (hour >= wake && hour < wake + 2) return "low";
  if (profile.energyProfile.morningPerson) {
    if (hour >= 13 && hour <= 14) return "low";
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
  const bed  = parseInt(profile.bedTime.split(":")[0]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, h) => ({
    hour: h, zone: getZone(h, profile), isCurrent: h === now,
    isActive: h >= wake && h < bed,
  })), [profile, now, wake, bed]);

  const peakHours = hours.filter(h => h.zone === "peak");
  const currentZone = hours[now]?.zone;

  function fmt(h: number) {
    if (h === 0) return "12a";
    if (h === 12) return "12p";
    return h < 12 ? `${h}a` : `${h-12}p`;
  }

  /* spec §5.1 energy forecast: cyan-tinted card
     Peak bars = Cyan, high = Lime 45% opacity, low = White 10% */
  const barColor = (zone: EnergyZone, isActive: boolean) => {
    if (!isActive) return "rgba(255,255,255,0.04)";
    if (zone === "peak")   return "var(--cyan)";
    if (zone === "active") return "rgba(200,255,0,0.45)";
    return "rgba(255,255,255,0.10)";
  };

  const barH = (zone: EnergyZone, isActive: boolean) => {
    if (!isActive) return 6;
    if (zone === "peak")   return 48;
    if (zone === "active") return 32;
    if (zone === "low")    return 16;
    return 6;
  };

  return (
    /* spec §5.1: cyan-tinted card */
    <div style={{
      background: "rgba(0,245,212,0.04)",
      border: "1px solid rgba(0,245,212,0.12)",
      borderRadius: "var(--card-radius)", padding: "var(--card-pad)",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginBottom: 2 }}>energy forecast</div>
        {/* spec §5.1: "peak window: Xpm - Xpm" in Cyan 9px */}
        {peakHours.length > 0 ? (
          <div style={{ fontSize: 9, color: "var(--cyan)", fontFamily: "var(--font-body)" }}>
            peak window: {fmt(peakHours[0].hour)} – {fmt(peakHours[peakHours.length-1].hour)}
          </div>
        ) : (
          <div style={{ fontSize: 9, color: "var(--text-muted)" }}>now: {currentZone}</div>
        )}
      </div>

      {/* 24 hourly bars — spec §5.1: flex */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 48 }}>
        {hours.map(({ hour, zone, isCurrent, isActive }) => (
          <div key={hour} style={{
            flex: 1, height: barH(zone, isActive),
            background: barColor(zone, isActive),
            borderRadius: "2px 2px 0 0",
            boxShadow: isCurrent ? `0 0 6px ${barColor(zone, isActive)}` : "none",
            outline: isCurrent ? `1px solid ${barColor(zone, true)}` : "none",
            /* spec §7: spring from 0 staggered */
            animation: `bar-spring 300ms ${hour * 20}ms cubic-bezier(0.34,1.56,0.64,1) both`,
            transformOrigin: "bottom",
            transition: "height 0.3s ease",
          }} />
        ))}
      </div>

      {/* Hour labels sparse */}
      <div style={{ display: "flex", position: "relative", height: 12, marginTop: 3 }}>
        {[0,6,12,18].map(h => (
          <div key={h} style={{
            position: "absolute", left: `${(h/24)*100}%`, transform: "translateX(-50%)",
            fontSize: 8, color: h === now ? "var(--cyan)" : "rgba(255,255,255,0.20)",
            fontWeight: h === now ? 700 : 400, fontFamily: "var(--font-body)",
          }}>{fmt(h)}</div>
        ))}
      </div>
    </div>
  );
}
