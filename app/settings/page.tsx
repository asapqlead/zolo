"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZoloStore, calculateLevel } from "@/lib/store";
import { useSyncStatus } from "@/components/layout/SyncProvider";
import { pullFromSupabase } from "@/lib/sync";
import { hasSupabase } from "@/lib/supabase";
import { Sun, Moon, Clock, Trash2, Download, RefreshCw, Cloud, CloudOff } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, updateProfile, totalXP, dayStreak, habits, tasks, reflections, addXP, checkDayStreak } = useZoloStore();
  const { level, xpInLevel, xpForNext } = calculateLevel(totalXP);

  const [saved, setSaved] = useState(false);
  const [wakeTime, setWakeTime] = useState(profile?.wakeTime || "07:30");
  const [bedTime, setBedTime] = useState(profile?.bedTime || "23:00");
  const [bufferMinutes, setBufferMinutes] = useState(profile?.bufferMinutes || 30);
  const [name, setName] = useState(profile?.name || "");
  const [confirmReset, setConfirmReset] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullMsg, setPullMsg] = useState("");
  const { status, lastSynced, forcePush, userId } = useSyncStatus();

  if (!profile) return null;

  function handleSave() {
    updateProfile({ wakeTime, bedTime, bufferMinutes, name: name.trim() || profile!.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    localStorage.removeItem("zolo-storage");
    window.location.href = "/";
  }

  function exportData() {
    const data = {
      profile, tasks, habits, reflections,
      totalXP, dayStreak,
      exportedAt: new Date().toISOString(),
      version: "1.2",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zolo-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, paddingLeft: 2 }}>{title}</div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ children, last = false }: { children: React.ReactNode; last?: boolean }) => (
    <div style={{ padding: "14px 16px", borderBottom: last ? "none" : "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", padding: "52px 20px 24px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, marginBottom: 20 }}>settings</h1>

      {/* Player card */}
      <div style={{ background: "linear-gradient(135deg, var(--lime)12, var(--cyan)08)", border: "1px solid var(--lime)30", borderRadius: 18, padding: "18px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "var(--lime)", lineHeight: 1 }}>LVL {level}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{totalXP.toLocaleString()} XP</div>
          </div>
        </div>

        <div style={{ height: 6, background: "rgba(0,0,0,0.3)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(xpInLevel / xpForNext) * 100}%`, background: "linear-gradient(90deg, var(--lime), var(--cyan))", borderRadius: 3, transition: "width 0.8s ease", boxShadow: "0 0 10px var(--lime)60" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
          {[
            { label: "streak", value: `${dayStreak}d`, color: "var(--amber)" },
            { label: "habits", value: habits.length, color: "var(--cyan)" },
            { label: "quests", value: tasks.filter(t => t.completed).length, color: "var(--purple)" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile */}
      <Section title="profile">
        <Row>
          <div style={{ fontSize: 20 }}>👤</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Display name</div>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ background: "transparent", border: "none", color: "var(--text)", fontSize: 15, fontWeight: 600, outline: "none", width: "100%", fontFamily: "var(--font-body)" }} />
          </div>
        </Row>
        <Row last>
          <div style={{ fontSize: 20 }}>
            {profile.energyProfile.morningPerson ? "🌅" : "🌙"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Energy type</div>
            <div style={{ display: "flex", gap: 7 }}>
              {[true, false].map(isMorning => (
                <button key={String(isMorning)}
                  onClick={() => updateProfile({ energyProfile: { ...profile.energyProfile, morningPerson: isMorning, peakHours: isMorning ? [9,10,11] : [14,15,16,20,21] } })}
                  style={{ flex: 1, background: profile.energyProfile.morningPerson === isMorning ? (isMorning ? "var(--amber)20" : "var(--purple)20") : "var(--surface2)", border: `1px solid ${profile.energyProfile.morningPerson === isMorning ? (isMorning ? "var(--amber)" : "var(--purple)") : "var(--border)"}`, borderRadius: 9, padding: "9px 6px", cursor: "pointer", color: "var(--text)", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}>
                  {isMorning ? "🌅 morning" : "🌙 night owl"}
                </button>
              ))}
            </div>
          </div>
        </Row>
      </Section>

      {/* Schedule */}
      <Section title="my schedule">
        <Row>
          <Sun size={18} color="var(--amber)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Wake-up time</div>
            <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
              style={{ background: "transparent", border: "none", color: "var(--text)", fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, outline: "none", colorScheme: "dark" }} />
          </div>
        </Row>
        <Row>
          <Moon size={18} color="var(--purple)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Bedtime</div>
            <input type="time" value={bedTime} onChange={e => setBedTime(e.target.value)}
              style={{ background: "transparent", border: "none", color: "var(--text)", fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, outline: "none", colorScheme: "dark" }} />
          </div>
        </Row>
        <Row last>
          <Clock size={18} color="var(--cyan)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Wind-down buffer</div>
            <div style={{ display: "flex", gap: 7 }}>
              {[15, 30, 45, 60].map(m => (
                <button key={m} onClick={() => setBufferMinutes(m)}
                  style={{ flex: 1, background: bufferMinutes === m ? "var(--cyan)15" : "var(--surface2)", border: `1px solid ${bufferMinutes === m ? "var(--cyan)" : "var(--border)"}`, borderRadius: 8, padding: "8px 2px", color: bufferMinutes === m ? "var(--cyan)" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </Row>
      </Section>

      {/* Save */}
      <button onClick={handleSave}
        style={{ width: "100%", background: saved ? "transparent" : "var(--lime)", color: saved ? "var(--lime)" : "var(--bg)", border: saved ? "1px solid var(--lime)" : "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 20, transition: "all 0.3s", boxShadow: saved ? "none" : "0 0 24px var(--lime)40" }}>
        {saved ? "✓ saved!" : "save changes"}
      </button>

      {/* Sync */}
      <Section title="cloud sync">
        {hasSupabase ? (
          <>
            <Row>
              <Cloud size={17} color="var(--cyan)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Supabase sync</div>
                <div style={{ fontSize: 11, color: status === "synced" ? "var(--lime)" : status === "error" ? "var(--pink)" : "var(--text-muted)" }}>
                  {status === "synced" ? `synced ${lastSynced ? lastSynced.toLocaleTimeString() : ""}` :
                   status === "syncing" ? "syncing…" :
                   status === "error" ? "sync error — tap to retry" : "ready"}
                </div>
              </div>
              <button onClick={forcePush}
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                push
              </button>
            </Row>
            <Row last>
              <RefreshCw size={17} color="var(--purple)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Pull from cloud</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {pullMsg || "Restore data from another device"}
                </div>
              </div>
              <button onClick={async () => {
                setPulling(true); setPullMsg("");
                const { ok, error } = await pullFromSupabase();
                setPulling(false);
                setPullMsg(ok ? "pulled ✓" : `error: ${error}`);
                setTimeout(() => setPullMsg(""), 3000);
              }} disabled={pulling}
                style={{ background: "var(--purple)20", border: "1px solid var(--purple)50", borderRadius: 8, padding: "7px 12px", color: "var(--purple)", fontSize: 12, fontWeight: 700, cursor: pulling ? "not-allowed" : "pointer" }}>
                {pulling ? "…" : "pull"}
              </button>
            </Row>
          </>
        ) : (
          <Row last>
            <CloudOff size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Cloud sync disabled</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, marginTop: 2 }}>
                Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Vercel env vars, then run the schema from supabase-schema.sql.
              </div>
            </div>
          </Row>
        )}
      </Section>

      {/* Data */}
      <Section title="data">
        <Row>
          <Download size={17} color="var(--cyan)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Export data</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Download as JSON backup</div>
          </div>
          <button onClick={exportData}
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            export
          </button>
        </Row>
        <Row last>
          <Trash2 size={17} color="var(--pink)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pink)" }}>Reset everything</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Wipe all data. This cannot be undone.</div>
          </div>
          <button onClick={handleReset}
            style={{ background: confirmReset ? "var(--pink)" : "var(--pink)15", border: "1px solid var(--pink)50", borderRadius: 8, padding: "7px 14px", color: confirmReset ? "white" : "var(--pink)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
            {confirmReset ? "confirm?" : "reset"}
          </button>
        </Row>
      </Section>

      <div style={{ textAlign: "center", color: "var(--text-dim)", fontSize: 11, paddingTop: 4, lineHeight: 1.8 }}>
        ZOLO v1.2 · built on the PRD{hasSupabase ? " · cloud sync on" : " · local only"}
        {userId && <div style={{ fontFamily: "monospace", fontSize: 9, marginTop: 4, letterSpacing: 0.5 }}>ID: {userId.slice(0,8)}…</div>}
      </div>
    </div>
  );
}
