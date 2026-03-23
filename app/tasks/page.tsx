"use client";
import { useState, useEffect } from "react";
import { useZoloStore, Priority } from "@/lib/store";
import { Plus, Trash2, RotateCcw, Archive, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { format, addDays, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { useConfetti } from "@/lib/useConfetti";

type Tab = "today" | "tomorrow" | "decaying" | "all";

const PRIORITY_XP: Record<Priority, number> = { low: 50, medium: 100, high: 150 };
const PRIORITY_COLOR: Record<Priority, string> = {
  low: "var(--text-muted)", medium: "var(--amber)", high: "var(--pink)"
};
const DECAY_BADGE: Record<string, { label: string; color: string }> = {
  "at-risk":  { label: "⚠️ at risk",  color: "var(--amber)" },
  decaying:   { label: "🔥 decaying", color: "var(--pink)" },
  critical:   { label: "💀 critical", color: "var(--red)" },
};

export default function TasksPage() {
  const { tasks, addTask, completeTask, uncompleteTask, deleteTask, archiveTask, rescheduleTask, updateTaskDecay } = useZoloStore();
  const { fire } = useConfetti();
  const [tab, setTab] = useState<Tab>("today");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<{ amount: number; id: number } | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  useEffect(() => { updateTaskDecay(); }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const active = tasks.filter(t => t.decayState !== "archived");
  const todayTasks = active.filter(t => t.date === today).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
  const tomorrowTasks = active.filter(t => t.date === tomorrow);
  const decayingTasks = active.filter(t => !t.completed && ["at-risk","decaying","critical"].includes(t.decayState));
  const allTasks = active.filter(t => t.date >= today).sort((a,b) => a.date.localeCompare(b.date));

  const tabData: Record<Tab, typeof active> = {
    today: todayTasks,
    tomorrow: tomorrowTasks,
    decaying: decayingTasks,
    all: allTasks,
  };

  const tabCounts = {
    today: todayTasks.length,
    tomorrow: tomorrowTasks.length,
    decaying: decayingTasks.length,
    all: allTasks.length,
  };

  function handleAdd() {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), priority: newPriority, completed: false, date: newDate });
    setNewTitle("");
    setNewPriority("medium");
    setNewDate(today);
    setShowAdd(false);
  }

  function handleComplete(id: string) {
    const { xpGained } = completeTask(id);
    if (xpGained) {
      const toastId = Date.now();
      setXpToast({ amount: xpGained, id: toastId });
      fire({ type: "mild" });
      setTimeout(() => setXpToast(null), 1400);
    }
  }

  function handleReschedule(id: string, date: string) {
    rescheduleTask(id, date);
    setRescheduleId(null);
    setExpandedId(null);
  }

  const displayed = tabData[tab];
  const completedToday = todayTasks.filter(t => t.completed).length;
  const allDoneToday = todayTasks.length > 0 && completedToday === todayTasks.length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>

      {/* XP Toast */}
      {xpToast && (
        <div key={xpToast.id} style={{
          position: "fixed", top: "22%", left: "50%", transform: "translateX(-50%)",
          zIndex: 999, fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 28, color: "var(--lime)", textShadow: "0 0 20px var(--lime)",
          animation: "xp-fly 1.2s ease-out forwards", pointerEvents: "none",
        }}>+{xpToast.amount} XP</div>
      )}

      {/* Header */}
      <div style={{
        padding: "20px 16px 14px",
        background: "linear-gradient(180deg, var(--surface) 0%, transparent 100%)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>quests</h1>
            {allDoneToday && (
              <p style={{ color: "var(--lime)", fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                ✨ all done today — you actually did it
              </p>
            )}
          </div>
          <button onClick={() => { setShowAdd(v => !v); setNewDate(tab === "tomorrow" ? tomorrow : today); }}
            style={{ background: "var(--lime)", color: "var(--bg)", border: "none", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 0 20px var(--lime)50", transition: "all 0.2s" }}>
            <Plus size={15} /> add quest
          </button>
        </div>

        {/* Today progress bar */}
        {todayTasks.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>today's progress</span>
              <span style={{ fontSize: 11, color: "var(--lime)", fontWeight: 700 }}>{completedToday}/{todayTasks.length}</span>
            </div>
            <div style={{ height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0}%`,
                background: allDoneToday ? "var(--lime)" : "linear-gradient(90deg, var(--cyan), var(--lime))",
                borderRadius: 2, transition: "width 0.6s ease",
                boxShadow: allDoneToday ? "0 0 8px var(--lime)" : "none",
              }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 20px 0" }}>

        {/* Add Task Form */}
        {showAdd && (
          <div className="animate-slide-up" style={{
            background: "var(--surface)", border: "1px solid var(--lime)40",
            borderRadius: 16, padding: "16px", marginBottom: 14,
          }}>
            <input
              autoFocus value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="what's the quest?"
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", marginBottom: 12 }}
              onFocus={e => e.target.style.borderColor = "var(--lime)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />

            {/* Priority */}
            <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
              {(["low","medium","high"] as Priority[]).map(p => (
                <button key={p} onClick={() => setNewPriority(p)}
                  style={{ flex: 1, background: newPriority === p ? `${PRIORITY_COLOR[p]}20` : "var(--surface2)", border: `1.5px solid ${newPriority === p ? PRIORITY_COLOR[p] : "var(--border)"}`, borderRadius: 9, padding: "9px 4px", color: newPriority === p ? PRIORITY_COLOR[p] : "var(--text-muted)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.18s", textAlign: "center" }}>
                  {p}<br />
                  <span style={{ fontSize: 10, opacity: 0.75 }}>+{PRIORITY_XP[p]} XP</span>
                </button>
              ))}
            </div>

            {/* Date */}
            <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
              {[
                { label: "today", date: today },
                { label: "tomorrow", date: tomorrow },
                { label: "custom", date: "custom" },
              ].map(opt => (
                <button key={opt.label}
                  onClick={() => { if (opt.date !== "custom") setNewDate(opt.date); }}
                  style={{ flex: opt.label === "custom" ? 0.8 : 1, background: newDate === opt.date ? "var(--purple)20" : "var(--surface2)", border: `1px solid ${newDate === opt.date ? "var(--purple)" : "var(--border)"}`, borderRadius: 9, padding: "8px 4px", color: newDate === opt.date ? "var(--purple)" : "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                  {opt.label === "custom" ? (
                    <input type="date" value={newDate < today ? today : newDate}
                      onChange={e => setNewDate(e.target.value)}
                      min={today}
                      style={{ background: "transparent", border: "none", color: "inherit", fontSize: 11, cursor: "pointer", outline: "none", width: "100%", colorScheme: "dark" }} />
                  ) : opt.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAdd(false)}
                style={{ flex: 1, background: "transparent", border: "1px solid var(--border)", borderRadius: 10, padding: "11px", color: "var(--text-muted)", cursor: "pointer", fontSize: 13 }}>
                cancel
              </button>
              <button onClick={handleAdd} disabled={!newTitle.trim()}
                style={{ flex: 2, background: newTitle.trim() ? "var(--lime)" : "var(--surface2)", color: newTitle.trim() ? "var(--bg)" : "var(--text-muted)", border: "none", borderRadius: 10, padding: "11px", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13, cursor: newTitle.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                add quest ⚡
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto" }} className="no-scrollbar">
          {([
            ["today", `today (${tabCounts.today})`],
            ["tomorrow", `tmrw (${tabCounts.tomorrow})`],
            ["decaying", `🔥 (${tabCounts.decaying})`],
            ["all", `all (${tabCounts.all})`],
          ] as [Tab, string][]).map(([key, label]) => {
            const isDecay = key === "decaying";
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{ flexShrink: 0, background: active ? (isDecay ? "var(--pink)20" : "var(--surface2)") : "transparent", border: `1px solid ${active ? (isDecay ? "var(--pink)" : "var(--border)") : "transparent"}`, borderRadius: 10, padding: "8px 12px", color: active ? (isDecay ? "var(--pink)" : "var(--text)") : "var(--text-muted)", fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap" }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Task list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 20 }}>
          {displayed.length === 0 && (
            <div style={{ textAlign: "center", padding: "52px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>
                {tab === "decaying" ? "🎉" : tab === "tomorrow" ? "🌙" : "✨"}
              </div>
              <p style={{ marginBottom: 16, fontSize: 14 }}>
                {tab === "decaying" ? "no decaying goals — you're locked in" :
                 tab === "tomorrow" ? "nothing planned for tomorrow yet" :
                 tab === "today" ? "no quests set for today" : "all caught up"}
              </p>
              {(tab === "today" || tab === "tomorrow") && (
                <button onClick={() => { setShowAdd(true); setNewDate(tab === "tomorrow" ? tomorrow : today); }}
                  style={{ background: "var(--lime)", color: "var(--bg)", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  add a quest ⚡
                </button>
              )}
            </div>
          )}

          {displayed.map(task => {
            const isExpanded = expandedId === task.id;
            const pColor = PRIORITY_COLOR[task.priority];
            const decay = DECAY_BADGE[task.decayState];
            const borderCol = task.decayState === "critical" ? "var(--red)" :
                              task.decayState === "decaying" ? "var(--pink)60" :
                              task.decayState === "at-risk" ? "var(--amber)50" : "var(--border)";

            return (
              <div key={task.id} className="animate-fade-in" style={{
                background: task.completed ? "var(--surface)50" : "var(--surface)",
                border: `1.5px solid ${task.completed ? "var(--border)50" : borderCol}`,
                borderRadius: 14, overflow: "hidden",
                opacity: task.completed ? 0.55 : 1,
                transition: "all 0.22s",
              }}>
                {/* Main row */}
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
                  {/* Complete button */}
                  <button onClick={() => task.completed ? uncompleteTask(task.id) : handleComplete(task.id)}
                    title={task.completed ? "tap to uncheck" : "tap to complete"}
                    style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${task.completed ? "var(--lime)" : pColor}`, background: task.completed ? "var(--lime)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                    {task.completed && <span style={{ color: "var(--bg)", fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </button>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "var(--text-muted)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {task.title}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: pColor, fontWeight: 700, textTransform: "uppercase" }}>{task.priority}</span>
                      {!task.completed && <span style={{ fontSize: 10, color: "var(--text-dim)" }}>+{PRIORITY_XP[task.priority]} XP</span>}
                      {decay && !task.completed && (
                        <span className="animate-pulse-slow" style={{ fontSize: 10, color: decay.color, fontWeight: 700 }}>{decay.label}</span>
                      )}
                      {tab === "all" && (
                        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>
                          {isToday(parseISO(task.date)) ? "today" : isTomorrow(parseISO(task.date)) ? "tomorrow" : task.date}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand */}
                  <button onClick={() => { setExpandedId(isExpanded ? null : task.id); setRescheduleId(null); }}
                    style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 4, display: "flex" }}>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="animate-fade-in" style={{ borderTop: "1px solid var(--border)", padding: "10px 14px" }}>

                    {/* Reschedule inline */}
                    {rescheduleId === task.id ? (
                      <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
                        <input type="date" min={today}
                          defaultValue={addDays(new Date(), 1).toISOString().split("T")[0]}
                          onChange={e => setRescheduleDate(e.target.value)}
                          style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--cyan)", borderRadius: 8, padding: "8px 10px", color: "var(--text)", fontSize: 12, outline: "none", colorScheme: "dark" }} />
                        <button onClick={() => handleReschedule(task.id, rescheduleDate || tomorrow)}
                          style={{ background: "var(--cyan)", color: "var(--bg)", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          set date
                        </button>
                        <button onClick={() => setRescheduleId(null)}
                          style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 7 }}>
                        {!task.completed && (
                          <>
                            <button onClick={() => handleReschedule(task.id, tomorrow)}
                              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 4px", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <RotateCcw size={11} /> tomorrow
                            </button>
                            <button onClick={() => { setRescheduleId(task.id); setRescheduleDate(tomorrow); }}
                              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 4px", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <Calendar size={11} /> pick date
                            </button>
                            <button onClick={() => { archiveTask(task.id); setExpandedId(null); }}
                              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 4px", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                              <Archive size={11} /> archive
                            </button>
                          </>
                        )}
                        <button onClick={() => { deleteTask(task.id); setExpandedId(null); }}
                          style={{ flex: task.completed ? 2 : 1, background: "var(--pink)10", border: "1px solid var(--pink)40", borderRadius: 8, padding: "8px 4px", color: "var(--pink)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <Trash2 size={11} /> delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
