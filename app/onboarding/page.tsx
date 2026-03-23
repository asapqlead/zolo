"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZoloStore, UserProfile } from "@/lib/store";
import { ChevronRight, ChevronLeft, Sun, Moon } from "lucide-react";

const STEPS = ["welcome", "schedule", "energy", "habits", "tasks"] as const;
type Step = typeof STEPS[number];

const HABIT_SUGGESTIONS = [
  { icon: "💧", name: "Drink water", category: "Health" },
  { icon: "🧘", name: "Meditate", category: "Mindset" },
  { icon: "📚", name: "Read 20 min", category: "Learning" },
  { icon: "🏃", name: "Exercise", category: "Health" },
  { icon: "📝", name: "Journal", category: "Mindset" },
  { icon: "🌙", name: "No screens 1hr before bed", category: "Health" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, addHabit, addTask } = useZoloStore();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [wakeTime, setWakeTime] = useState("07:30");
  const [bedTime, setBedTime] = useState("23:00");
  const [morningPerson, setMorningPerson] = useState<boolean | null>(null);
  const [focusLen, setFocusLen] = useState(25);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [task1, setTask1] = useState("");
  const [task2, setTask2] = useState("");
  const [task3, setTask3] = useState("");

  const stepIdx = STEPS.indexOf(step);
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }
  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  function finish() {
    const profile: UserProfile = {
      name: name.trim() || "Player",
      wakeTime,
      bedTime,
      bufferMinutes: 30,
      energyProfile: {
        morningPerson: morningPerson ?? true,
        focusSessionLength: focusLen,
        peakHours: morningPerson ? [9, 10, 11] : [14, 15, 16, 20, 21],
      },
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
    };

    // Clear any leftover tasks/habits from a previous session before writing new ones
    useZoloStore.setState({ tasks: [], habits: [] });

    setProfile(profile);

    // Only add habits the user explicitly selected (selectedHabits starts empty)
    selectedHabits.forEach((habitName) => {
      const h = HABIT_SUGGESTIONS.find((s) => s.name === habitName);
      if (h) addHabit({ name: h.name, icon: h.icon, category: h.category as any, frequency: "daily" });
    });

    // Only add tasks the user actually typed
    const today = new Date().toISOString().split("T")[0];
    [task1, task2, task3].filter((t) => t.trim()).forEach((title) => {
      addTask({ title: title.trim(), priority: "medium", completed: false, date: today });
    });

    useZoloStore.getState().addXP(100);

    router.push("/dashboard");
  }

  const backBtn = (
    <button onClick={back} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 20px", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)", fontSize: 14 }}>
      <ChevronLeft size={16} /> back
    </button>
  );

  const nextBtn = (onClick: () => void, disabled = false) => (
    <button onClick={onClick} disabled={disabled} style={{ background: disabled ? "var(--surface2)" : "var(--lime)", color: disabled ? "var(--text-muted)" : "var(--bg)", border: "none", borderRadius: 12, padding: "14px 28px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", boxShadow: disabled ? "none" : "0 0 20px var(--lime)40" }}>
      next <ChevronRight size={18} />
    </button>
  );

  const skipBtn = (label = "skip for now", onClick = next) => (
    <button onClick={onClick} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: "8px 12px", textDecoration: "underline", textUnderlineOffset: 3 }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", padding: "0 0 40px", maxWidth: 480, margin: "0 auto" }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--surface2)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${progress}%`, background: "var(--lime)", transition: "width 0.4s ease", boxShadow: "0 0 8px var(--lime)" }} />
      </div>

      <div style={{ flex: 1, padding: "32px 24px 0", display: "flex", flexDirection: "column" }}>

        {/* ── WELCOME ────────────────────────────────────────────── */}
        {step === "welcome" && (
          <div className="animate-slide-up" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ marginBottom: 8, fontSize: 48 }}>⚡</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 42, color: "var(--lime)", lineHeight: 1, marginBottom: 8, textShadow: "0 0 40px var(--lime)60" }}>ZOLO</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 40, lineHeight: 1.5 }}>
              do the thing.<br />get the points.
            </p>
            <label style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
              What should we call you?
            </label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && next()}
              placeholder="your name or alias" maxLength={24}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", color: "var(--text)", fontSize: 16, fontFamily: "var(--font-body)", outline: "none", marginBottom: 32 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--lime)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {nextBtn(next, !name.trim())}
            </div>
          </div>
        )}

        {/* ── SCHEDULE ───────────────────────────────────────────── */}
        {step === "schedule" && (
          <div className="animate-slide-up" style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, marginBottom: 8 }}>your day's bookends 🌅</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 14, lineHeight: 1.5 }}>
              Zolo builds everything around when you wake up and when you sleep.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  <Sun size={14} color="var(--amber)" /> Wake-up time
                </label>
                <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
                  style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", color: "var(--text)", fontSize: 20, fontFamily: "var(--font-display)", fontWeight: 700, outline: "none", colorScheme: "dark" }} />
              </div>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  <Moon size={14} color="var(--purple)" /> Bedtime
                </label>
                <input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)}
                  style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", color: "var(--text)", fontSize: 20, fontFamily: "var(--font-display)", fontWeight: 700, outline: "none", colorScheme: "dark" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {backBtn}
              {nextBtn(next)}
            </div>
          </div>
        )}

        {/* ── ENERGY ─────────────────────────────────────────────── */}
        {step === "energy" && (
          <div className="animate-slide-up" style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, marginBottom: 8 }}>your energy vibe ⚡</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 14, lineHeight: 1.5 }}>
              We use this to build your personal energy forecast.
            </p>
            <div style={{ marginBottom: 28 }}>
              <label style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, display: "block" }}>
                When are you naturally sharpest?
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[true, false].map((isMorning) => (
                  <button key={String(isMorning)} onClick={() => setMorningPerson(isMorning)}
                    style={{ background: morningPerson === isMorning ? (isMorning ? "var(--amber)20" : "var(--purple)20") : "var(--surface)", border: `2px solid ${morningPerson === isMorning ? (isMorning ? "var(--amber)" : "var(--purple)") : "var(--border)"}`, borderRadius: 16, padding: "20px 16px", color: "var(--text)", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{isMorning ? "🌅" : "🌙"}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{isMorning ? "Morning" : "Night owl"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{isMorning ? "Peak: 9am–12pm" : "Peak: 2pm–6pm / evening"}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 40 }}>
              <label style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, display: "block" }}>
                Preferred focus session length
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {[25, 45, 60, 90].map((mins) => (
                  <button key={mins} onClick={() => setFocusLen(mins)}
                    style={{ flex: 1, background: focusLen === mins ? "var(--lime)20" : "var(--surface)", border: `2px solid ${focusLen === mins ? "var(--lime)" : "var(--border)"}`, borderRadius: 12, padding: "12px 4px", color: focusLen === mins ? "var(--lime)" : "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, transition: "all 0.2s" }}>
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {backBtn}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {skipBtn()}
                {nextBtn(next, morningPerson === null)}
              </div>
            </div>
          </div>
        )}

        {/* ── HABITS ─────────────────────────────────────────────── */}
        {step === "habits" && (
          <div className="animate-slide-up" style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, marginBottom: 8 }}>pick your first habits ✨</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
              Pick up to 3 to start — or skip and add them later.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {HABIT_SUGGESTIONS.map((h) => {
                const selected = selectedHabits.includes(h.name);
                const maxed = selectedHabits.length >= 3 && !selected;
                return (
                  <button key={h.name}
                    onClick={() => {
                      if (maxed) return;
                      setSelectedHabits((prev) => selected ? prev.filter((x) => x !== h.name) : [...prev, h.name]);
                    }}
                    style={{ background: selected ? "var(--lime)15" : "var(--surface)", border: `1.5px solid ${selected ? "var(--lime)" : "var(--border)"}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: maxed ? "not-allowed" : "pointer", opacity: maxed ? 0.4 : 1, transition: "all 0.2s", textAlign: "left" }}>
                    <span style={{ fontSize: 22 }}>{h.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: selected ? "var(--lime)" : "var(--text)", fontWeight: 600, fontSize: 14 }}>{h.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{h.category}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? "var(--lime)" : "var(--border)"}`, background: selected ? "var(--lime)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {selected && <span style={{ color: "var(--bg)", fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {backBtn}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {skipBtn("skip", () => { setSelectedHabits([]); next(); })}
                {nextBtn(next)}
              </div>
            </div>
          </div>
        )}

        {/* ── TASKS ──────────────────────────────────────────────── */}
        {step === "tasks" && (
          <div className="animate-slide-up" style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, marginBottom: 8 }}>set today's quests 🎯</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 14, lineHeight: 1.5 }}>
              What do you want to get done today? Skip if you want to set them later.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
              {([
                [task1, setTask1, "quest #1 (the most important)"],
                [task2, setTask2, "quest #2"],
                [task3, setTask3, "quest #3 (optional)"],
              ] as [string, (v: string) => void, string][]).map(([val, setter, placeholder], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <input value={val} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                    style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 16px", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--lime)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                </div>
              ))}
            </div>
            <div style={{ background: "var(--lime)10", border: "1px solid var(--lime)30", borderRadius: 12, padding: "12px 16px", marginBottom: 32, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎁</span>
              <span style={{ fontSize: 13, color: "var(--lime)" }}>
                You'll get <strong>+100 XP</strong> just for showing up today
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {backBtn}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {skipBtn("skip", finish)}
                <button onClick={finish}
                  style={{ background: "var(--lime)", color: "var(--bg)", border: "none", borderRadius: 12, padding: "14px 28px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 0 24px var(--lime)60" }}>
                  let's go ⚡
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
