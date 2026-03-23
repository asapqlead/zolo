"use client";
import { useState } from "react";
import { useZoloStore, HabitCategory, XP_EARN } from "@/lib/store";
import { Plus, Trash2, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { useConfetti } from "@/lib/useConfetti";

const CATEGORIES: HabitCategory[] = ["Mindset","Health","Learning","Social","Deep Work","Custom"];
const CAT_ICONS: Record<HabitCategory, string> = {
  Mindset:"🧠", Health:"❤️", Learning:"📚", Social:"👥", "Deep Work":"🎯", Custom:"⭐"
};
const PRESET_ICONS = ["💧","🧘","📚","🏃","📝","🌙","☀️","🍎","🎵","💪","🖊️","🎯","🧹","💤","🌿","🎸","🏊","🧗","🌅","🍵"];
const FREQ_OPTS = [
  { value: "daily" as const, label: "Every day" },
  { value: "weekdays" as const, label: "Weekdays" },
  { value: "weekends" as const, label: "Weekends" },
];

function HeatmapRow({ completedDates }: { completedDates: string[] }) {
  const days = Array.from({ length: 21 }, (_, i) => {
    const d = format(subDays(new Date(), 20 - i), "yyyy-MM-dd");
    return { date: d, done: completedDates.includes(d), label: format(subDays(new Date(), 20 - i), "d") };
  });
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
      {days.map(day => (
        <div key={day.date} title={day.date}
          style={{ flex: 1, aspectRatio: "1", borderRadius: 3, background: day.done ? "var(--lime)" : "var(--surface2)", boxShadow: day.done ? "0 0 4px var(--lime)60" : "none", transition: "background 0.2s" }} />
      ))}
    </div>
  );
}

export default function HabitsPage() {
  const { habits, addHabit, completeHabit, uncompleteHabit, deleteHabit } = useZoloStore();
  const { fire } = useConfetti();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [category, setCategory] = useState<HabitCategory>("Custom");
  const [frequency, setFrequency] = useState<"daily"|"weekdays"|"weekends">("daily");
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const dow = new Date().getDay();

  function isActiveToday(freq: string) {
    if (freq === "daily") return true;
    if (freq === "weekdays") return dow >= 1 && dow <= 5;
    if (freq === "weekends") return dow === 0 || dow === 6;
    return true;
  }

  function handleAdd() {
    if (!name.trim()) return;
    addHabit({ name: name.trim(), icon, category, frequency });
    setName(""); setIcon("⭐"); setCategory("Custom"); setFrequency("daily");
    setShowAdd(false);
  }

  function handleComplete(id: string) {
    const { xpGained } = completeHabit(id);
    if (xpGained) {
      setXpToast(xpGained);
      fire({ type: "mild" });
      setTimeout(() => setXpToast(null), 1400);
    }
  }

  const activeToday = habits.filter(h => isActiveToday(h.frequency));
  const doneToday = activeToday.filter(h => h.completedDates.includes(today)).length;
  const allDone = activeToday.length > 0 && doneToday === activeToday.length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {xpToast && (
        <div style={{ position: "fixed", top: "22%", left: "50%", transform: "translateX(-50%)", zIndex: 999, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--lime)", textShadow: "0 0 20px var(--lime)", animation: "xp-fly 1.2s ease-out forwards", pointerEvents: "none" }}>
          +{xpToast} XP
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "20px 16px 14px", background: "linear-gradient(180deg, var(--surface) 0%, transparent 100%)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>habits</h1>
            {allDone
              ? <p style={{ color: "var(--lime)", fontSize: 12, marginTop: 4, fontWeight: 600 }}>all habits locked in today 🎉</p>
              : <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>{doneToday}/{activeToday.length} done today</p>
            }
          </div>
          <button onClick={() => setShowAdd(v => !v)}
            style={{ background: "var(--lime)", color: "var(--bg)", border: "none", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 0 20px var(--lime)50" }}>
            <Plus size={15} /> add habit
          </button>
        </div>

        {/* Progress bar */}
        {activeToday.length > 0 && (
          <div style={{ height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(doneToday / activeToday.length) * 100}%`, background: allDone ? "var(--lime)" : "linear-gradient(90deg, var(--lime), var(--cyan))", borderRadius: 2, transition: "width 0.6s ease", boxShadow: allDone ? "0 0 8px var(--lime)" : "none" }} />
          </div>
        )}
      </div>

      <div style={{ padding: "14px 20px 24px" }}>

        {/* Add form */}
        {showAdd && (
          <div className="animate-slide-up" style={{ background: "var(--surface)", border: "1px solid var(--lime)40", borderRadius: 16, padding: "16px", marginBottom: 14 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>pick an icon</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PRESET_ICONS.map(ic => (
                  <button key={ic} onClick={() => setIcon(ic)}
                    style={{ width: 36, height: 36, fontSize: 18, background: icon === ic ? "var(--lime)20" : "var(--surface2)", border: `1.5px solid ${icon === ic ? "var(--lime)" : "var(--border)"}`, borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="habit name"
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", marginBottom: 12 }}
              onFocus={e => e.target.style.borderColor = "var(--lime)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>category</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    style={{ background: category === c ? "var(--purple)20" : "var(--surface2)", border: `1px solid ${category === c ? "var(--purple)" : "var(--border)"}`, borderRadius: 8, padding: "6px 10px", color: category === c ? "var(--purple)" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                    {CAT_ICONS[c]} {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {FREQ_OPTS.map(f => (
                <button key={f.value} onClick={() => setFrequency(f.value)}
                  style={{ flex: 1, background: frequency === f.value ? "var(--cyan)15" : "var(--surface2)", border: `1px solid ${frequency === f.value ? "var(--cyan)" : "var(--border)"}`, borderRadius: 8, padding: "9px 4px", color: frequency === f.value ? "var(--cyan)" : "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAdd(false)}
                style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", borderRadius: 10, padding: "11px", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>cancel</button>
              <button onClick={handleAdd} disabled={!name.trim()}
                style={{ flex: 2, background: name.trim() ? "var(--lime)" : "var(--surface2)", color: name.trim() ? "var(--bg)" : "var(--text-muted)", border: "none", borderRadius: 10, padding: "11px", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13, cursor: name.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                add habit ⚡
              </button>
            </div>
          </div>
        )}

        {/* Today's habits */}
        {activeToday.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>today</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activeToday.map(habit => {
                const done = habit.completedDates.includes(today);
                const isExpanded = expandedId === habit.id;
                return (
                  <div key={habit.id} style={{ background: done ? "var(--lime)08" : "var(--surface)", border: `1.5px solid ${done ? "var(--lime)30" : "var(--border)"}`, borderRadius: 16, overflow: "hidden", transition: "all 0.25s", opacity: done ? 0.72 : 1 }}>
                    <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{habit.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, textDecoration: done ? "line-through" : "none", color: done ? "var(--text-muted)" : "var(--text)" }}>{habit.name}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--surface2)", borderRadius: 4, padding: "1px 6px" }}>{CAT_ICONS[habit.category]} {habit.category}</span>
                          {habit.streak > 0 && <span style={{ fontSize: 10, color: "var(--amber)", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><Flame size={9} />{habit.streak}d</span>}
                          {!done && <span style={{ fontSize: 10, color: "var(--text-dim)" }}>+{XP_EARN.habit}XP</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => setExpandedId(isExpanded ? null : habit.id)}
                          style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 2 }}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button onClick={() => done ? uncompleteHabit(habit.id) : handleComplete(habit.id)}
                          title={done ? "tap to uncheck" : "tap to complete"}
                          style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${done ? "var(--lime)" : "var(--border)"}`, background: done ? "var(--lime)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                          {done ? <span style={{ color: "var(--bg)", fontSize: 15, fontWeight: 900 }}>✓</span> : null}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="animate-fade-in" style={{ borderTop: "1px solid var(--border)", padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>last 21 days</div>
                        <HeatmapRow completedDates={habit.completedDates} />
                        <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
                          <span>current: <strong style={{ color: "var(--amber)" }}>{habit.streak}d</strong></span>
                          <span>best: <strong style={{ color: "var(--lime)" }}>{habit.longestStreak}d</strong></span>
                          <span>total: <strong style={{ color: "var(--text)" }}>{habit.completedDates.length}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All habits management */}
        {habits.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>all habits ({habits.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {habits.map(habit => (
                <div key={habit.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 13, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{habit.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{habit.name}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{habit.frequency}</span>
                      <span style={{ fontSize: 10, color: "var(--amber)", fontWeight: 600 }}>best {habit.longestStreak}d</span>
                      <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{habit.completedDates.length}× total</span>
                    </div>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)}
                    style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 6, borderRadius: 8, transition: "all 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--pink)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {habits.length === 0 && !showAdd && (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
            <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: 14 }}>no habits yet — start small</p>
            <button onClick={() => setShowAdd(true)}
              style={{ background: "var(--lime)", color: "var(--bg)", border: "none", borderRadius: 12, padding: "12px 24px", fontFamily: "var(--font-body)", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
              add your first habit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
