"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useZoloStore, getVibeColor, XP_EARN } from "@/lib/store";
import VibeScore from "@/components/ui/VibeScore";
import XPBar from "@/components/ui/XPBar";
import EnergyForecast from "@/components/features/EnergyForecast";
import BedtimeHandoff from "@/components/features/BedtimeHandoff";
import AllClearModal from "@/components/features/AllClearModal";
import StreakMilestoneBanner, { useStreakMilestone } from "@/components/features/StreakMilestone";
import { useConfetti } from "@/lib/useConfetti";
import { Flame, Timer, AlertTriangle, Moon, Plus } from "lucide-react";
import { format } from "date-fns";

interface XPToast { id: number; amount: number; x: number }

function useBedtimeCheck(profile: any) {
  const [showBedtime, setShowBedtime] = useState(false);
  const [showAllClear, setShowAllClear] = useState(false);
  const checkedRef = useRef(false);
  useEffect(() => {
    if (!profile || checkedRef.current) return;
    const now = new Date();
    const [bh] = profile.bedTime.split(":").map(Number);
    const bufferStart = bh * 60 - profile.bufferMinutes;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin >= bufferStart && nowMin < bh * 60 && now.getHours() > 12) {
      checkedRef.current = true;
      setShowBedtime(true);
    }
  }, [profile]);
  return { showBedtime, setShowBedtime, showAllClear, setShowAllClear };
}

export default function Dashboard() {
  const router = useRouter();
  const store = useZoloStore();
  const { profile, totalXP, dayStreak, getTodayTasks, getTodayHabits,
    getTodayVibeScore, getDecayingTasks, completeTask, completeHabit,
    uncompleteTask, uncompleteHabit, updateTaskDecay, addXP, checkDayStreak } = store;
  const { milestone, dismiss: dismissMilestone } = useStreakMilestone(dayStreak);

  const [toasts, setToasts] = useState<XPToast[]>([]);
  const [focusActive, setFocusActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusTarget, setFocusTarget] = useState(25 * 60);
  const [focusDone, setFocusDone] = useState(false);
  const { fire } = useConfetti();
  const { showBedtime, setShowBedtime, showAllClear, setShowAllClear } = useBedtimeCheck(profile);
  const prevAllDoneRef = useRef(false);

  useEffect(() => { if (!profile?.onboardingComplete) router.replace("/onboarding"); }, [profile, router]);
  useEffect(() => { updateTaskDecay(); checkDayStreak(); }, []);

  // Focus timer
  useEffect(() => {
    if (!focusActive) return;
    const t = setInterval(() => {
      setFocusSeconds(s => {
        if (s + 1 >= focusTarget) { setFocusActive(false); setFocusDone(true); fire({ type: "mild" }); return focusTarget; }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [focusActive, focusTarget]);

  // All-clear — once per day only
  const todayTasks = getTodayTasks();
  const allDone = todayTasks.length > 0 && todayTasks.every(t => t.completed);
  const ALL_CLEAR_KEY = "zolo-allclear-date";
  useEffect(() => {
    if (!allDone) { prevAllDoneRef.current = false; return; }
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (localStorage.getItem(ALL_CLEAR_KEY) === todayStr) return;
    if (!prevAllDoneRef.current) {
      prevAllDoneRef.current = true;
      localStorage.setItem(ALL_CLEAR_KEY, todayStr);
      addXP(XP_EARN.allTasksBonus);
      setShowAllClear(true);
      fire({ type: "burst" });
    }
  }, [allDone]);

  const showXPToast = useCallback((amount: number) => {
    const id = Date.now();
    setToasts(t => [...t, { id, amount, x: Math.random() * 50 + 25 }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 1200);
  }, []);

  const handleCompleteTask = (id: string) => {
    const { xpGained } = completeTask(id);
    if (xpGained) { showXPToast(xpGained); fire({ type: "mild" }); }
  };
  const handleCompleteHabit = (id: string) => {
    const { xpGained } = completeHabit(id);
    if (xpGained) showXPToast(xpGained);
  };

  if (!profile) return null;

  const todayHabits = getTodayHabits();
  const vibeScore = getTodayVibeScore();
  const vibeColor = getVibeColor(vibeScore);
  const decaying = getDecayingTasks();
  const today = format(new Date(), "yyyy-MM-dd");
  const tasksLeft = todayTasks.filter(t => !t.completed).length;
  const habitsLeft = todayHabits.filter(h => !h.completedDates.includes(today)).length;
  const focusMins = Math.floor(focusSeconds / 60);
  const focusSecs = focusSeconds % 60;
  const focusPct = Math.min(focusSeconds / focusTarget, 1);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>

      {/* XP Toasts — spec §7: 400ms ease-out */}
      {toasts.map(t => (
        <div key={t.id} style={{
          position: "fixed", top: "28%", left: `${t.x}%`, zIndex: 999,
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
          color: "var(--lime)", textShadow: "0 0 16px var(--lime)",
          pointerEvents: "none", animation: "xp-fly 0.4s ease-out forwards",
        }}>+{t.amount} xp</div>
      ))}

      {/* Modals */}
      {showBedtime && <BedtimeHandoff onClose={() => setShowBedtime(false)} />}
      {showAllClear && <AllClearModal vibeScore={vibeScore} onClose={() => setShowAllClear(false)} />}
      {milestone && <StreakMilestoneBanner streak={milestone} onDismiss={dismissMilestone} />}

      {/* Header — spec §4: 16px h-pad, 20px top */}
      <div style={{
        padding: "20px 16px 14px",
        background: "linear-gradient(180deg, var(--surface) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Greeting — spec §5.1: Syne 800 20px, username in Lime, sub-line Muted 10px */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
              gm, <span style={{ color: "var(--lime)" }}>{profile.name}</span> 👋
            </h1>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-body)" }}>
              {format(new Date(), "EEEE, MMM d")} · <span style={{ color: "var(--amber)" }}>🔥 {dayStreak}d streak</span> · {tasksLeft} quests left
            </p>
          </div>
          <button onClick={() => setShowBedtime(true)}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1, letterSpacing: "0.2px" }}>
            <Moon size={12} /> <span style={{ fontSize: 11 }}>wind down</span>
          </button>
        </div>
        <XPBar totalXP={totalXP} compact />
      </div>

      <div style={{ padding: "14px 16px 0" }}>

        {/* Vibe + Energy — spec §5.1 */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, marginBottom: 14 }}>
          {/* spec §5.1: Card bg #13131A, Lime border tint, score Syne 800 40px */}
          <div style={{
            background: "var(--surface)",
            border: `1px solid rgba(${vibeColor === "#C8FF00" ? "200,255,0" : vibeColor === "#00F5D4" ? "0,245,212" : vibeColor === "#FFB703" ? "255,183,3" : "247,37,133"}, 0.10)`,
            borderRadius: "var(--card-radius)", padding: "var(--card-pad)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <VibeScore score={vibeScore} size={110} />
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
              <MiniStat label="tasks" done={todayTasks.filter(t => t.completed).length} total={todayTasks.length} color="var(--cyan)" />
              <MiniStat label="habits" done={todayHabits.filter(h => h.completedDates.includes(today)).length} total={todayHabits.length} color="var(--lime)" />
            </div>
          </div>
          <EnergyForecast profile={profile} />
        </div>

        {/* Decay Alert — spec §5.3 & §6 decay card */}
        {decaying.length > 0 && (
          <div className="animate-slide-up" style={{ marginBottom: 14 }}>
            <div onClick={() => router.push("/tasks")} style={{
              background: "rgba(247,37,133,0.06)",
              border: "1px solid rgba(247,37,133,0.20)",
              borderRadius: 12, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
            }}>
              {/* spec §7: decay badge pulse */}
              <div className="animate-pulse-slow" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--pink)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--pink)", fontWeight: 500, fontSize: 13 }}>
                  {decaying.length} goal{decaying.length > 1 ? "s" : ""} decaying
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 10, marginTop: 2 }}>tap to rescue them</div>
              </div>
              <span style={{ color: "var(--pink)", fontSize: 12 }}>→</span>
            </div>
          </div>
        )}

        {/* Focus Session */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            background: focusActive ? "rgba(123,63,228,0.12)" : focusDone ? "rgba(200,255,0,0.06)" : "var(--surface)",
            border: `1px solid ${focusActive ? "rgba(123,63,228,0.30)" : focusDone ? "rgba(200,255,0,0.20)" : "var(--border)"}`,
            borderRadius: "var(--card-radius)", padding: "var(--card-pad)", transition: "all 0.3s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: focusActive ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Timer size={14} color={focusActive ? "var(--purple)" : focusDone ? "var(--lime)" : "var(--text-muted)"} />
                <span style={{ fontSize: 13, color: focusActive ? "var(--text)" : focusDone ? "var(--lime)" : "var(--text-muted)" }}>
                  {focusDone ? `session done +${XP_EARN.focusSession} xp` : focusActive ? "locked in 🔒" : "lock in mode"}
                </span>
              </div>
              {focusActive && (
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--purple)" }}>
                  {String(focusMins).padStart(2,"0")}:{String(focusSecs).padStart(2,"0")}
                </span>
              )}
            </div>
            {focusActive && (
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${focusPct*100}%`, background: "var(--purple)", transition: "width 1s linear", boxShadow: "0 0 6px var(--purple)" }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {!focusActive && !focusDone ? (
                [25,45,60].map(m => (
                  <button key={m} onClick={() => { setFocusTarget(m*60); setFocusSeconds(0); setFocusActive(true); setFocusDone(false); }}
                    style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 4px", color: "var(--text-muted)", cursor: "pointer" }}>
                    {m}m
                  </button>
                ))
              ) : focusActive ? (
                <button onClick={() => { setFocusActive(false); if (focusSeconds >= 25*60) { addXP(XP_EARN.focusSession); setFocusDone(true); fire({type:"mild"}); showXPToast(XP_EARN.focusSession); } else setFocusSeconds(0); }}
                  style={{ flex: 1, background: "var(--purple)", border: "none", borderRadius: 8, padding: "9px", color: "white", cursor: "pointer" }}>
                  end session
                </button>
              ) : (
                <button onClick={() => { setFocusDone(false); setFocusSeconds(0); }}
                  style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px", color: "var(--text-muted)", cursor: "pointer" }}>
                  start another
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Today's Quests — spec §5.1 task list */}
        <section style={{ marginBottom: "var(--gap-sections)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            {/* spec §5.1: "Today's Quests" label Muted uppercase 10px */}
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 }}>today's quests</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {tasksLeft > 0 && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{tasksLeft} left</span>}
              <button onClick={() => router.push("/tasks")}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "5px 10px", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, lineHeight: 1, letterSpacing: "0.2px" }}>
                <Plus size={10} /> add
              </button>
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", background: "var(--surface)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "var(--card-radius)" }}>
              {/* spec §5.2: Add Task row dashed border */}
              <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 10 }}>no quests yet today</p>
              <button onClick={() => router.push("/tasks")}
                style={{ background: "var(--lime)", color: "var(--bg)", border: "none", borderRadius: 14, padding: "13px 16px", cursor: "pointer", lineHeight: 1, letterSpacing: "0.2px" }}>
                add quests ⚡
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {todayTasks.slice(0,5).map((task, i) => {
                const pColor = task.priority === "high" ? "var(--pink)" : task.priority === "medium" ? "var(--amber)" : "var(--text-muted)";
                const xpAmt = task.priority === "high" ? 150 : task.priority === "medium" ? 100 : 50;
                /* spec §5.2 decay visual states */
                const isAtRisk = task.decayState === "at-risk";
                const isDecaying = task.decayState === "decaying" || task.decayState === "critical";
                const rowBg = isDecaying ? "rgba(247,37,133,0.05)" : isAtRisk ? "rgba(255,183,3,0.03)" : "transparent";
                const checkBg = task.completed ? "var(--lime)" : isDecaying ? "rgba(247,37,133,0.10)" : isAtRisk ? "rgba(255,183,3,0.10)" : "transparent";
                const checkBorder = task.completed ? "var(--lime)" : isDecaying ? "var(--pink)" : isAtRisk ? "var(--amber)" : "rgba(255,255,255,0.18)";

                return (
                  <div key={task.id} style={{
                    background: rowBg,
                    padding: "10px 0",
                    /* spec §5.1: rows divided by 1px White 4% line */
                    borderBottom: i < Math.min(todayTasks.length,5)-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    display: "flex", alignItems: "center", gap: 10,
                    opacity: task.completed ? 0.55 : 1, transition: "opacity 0.2s",
                  }}>
                    {/* spec §5.1: 17px circle check */}
                    <button onClick={() => task.completed ? uncompleteTask(task.id) : handleCompleteTask(task.id)}
                      style={{ width: 17, height: 17, borderRadius: "50%", border: `1.5px solid ${checkBorder}`, background: checkBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", padding: 0 }}>
                      {task.completed
                        ? <span style={{ color: "var(--bg)", fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>
                        : (isDecaying || isAtRisk)
                          ? <span className="animate-pulse-slow" style={{ color: isDecaying ? "var(--pink)" : "var(--amber)", fontSize: 8, fontWeight: 800, lineHeight: 1 }}>!</span>
                          : null}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* spec §5.1: task name DM Sans 12px */}
                      <div style={{ fontSize: 12, fontWeight: 400, textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "var(--text-muted)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.title}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                        {/* spec §5.2: priority sub-label Muted 9px */}
                        <span style={{ fontSize: 9, color: isAtRisk ? "var(--amber)" : isDecaying ? "var(--pink)" : "var(--text-muted)" }}>
                          {isDecaying ? "goal decaying" : isAtRisk ? "at risk" : task.priority}
                        </span>
                      </div>
                    </div>
                    {/* spec §5.1: XP Syne 10px — Lime if done, Muted if pending */}
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10, color: task.completed ? "var(--lime)" : "var(--text-muted)", flexShrink: 0 }}>
                      {task.completed ? `+${task.xpEarned ?? xpAmt}` : `+${xpAmt}`} xp
                    </span>
                  </div>
                );
              })}
              {todayTasks.length > 5 && (
                <button onClick={() => router.push("/tasks")}
                  style={{ marginTop: 8, background: "transparent", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "var(--card-radius)", padding: "9px", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, lineHeight: 1, letterSpacing: "0.2px" }}>
                  +{todayTasks.length - 5} more →
                </button>
              )}
            </div>
          )}
        </section>

        {/* Today's Habits */}
        {todayHabits.length > 0 && (
          <section style={{ marginBottom: "var(--gap-sections)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 }}>habits</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{habitsLeft} left</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-cards)" }}>
              {todayHabits.map(habit => {
                const done = habit.completedDates.includes(today);
                return (
                  <div key={habit.id} style={{
                    background: done ? "rgba(200,255,0,0.04)" : "var(--surface)",
                    border: `1px solid ${done ? "rgba(200,255,0,0.10)" : "var(--border)"}`,
                    borderRadius: "var(--card-radius)", padding: "var(--card-pad)",
                    display: "flex", alignItems: "center", gap: 10,
                    opacity: done ? 0.65 : 1, transition: "all 0.25s",
                  }}>
                    {/* spec §5.3: emoji icon 15px */}
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{habit.icon}</span>
                    <div style={{ flex: 1 }}>
                      {/* spec §5.3: name DM Sans 12px 500 */}
                      <div style={{ fontSize: 12, fontWeight: 500, textDecoration: done ? "line-through" : "none", color: done ? "var(--text-muted)" : "var(--text)" }}>{habit.name}</div>
                      {/* spec §5.3: streak count Syne 700 11px Amber + fire */}
                      {habit.streak > 0 && <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, color: "var(--amber)" }}>🔥 {habit.streak}d</span>}
                    </div>
                    <button onClick={() => done ? uncompleteHabit(habit.id) : handleCompleteHabit(habit.id)}
                      title={done ? "tap to uncheck" : "tap to complete"}
                      style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${done ? "var(--lime)" : "rgba(255,255,255,0.18)"}`, background: done ? "var(--lime)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", padding: 0 }}>
                      {done && <span style={{ color: "var(--bg)", fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function MiniStat({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{label}</span>
        <span style={{ fontSize: 9, color, fontFamily: "var(--font-display)", fontWeight: 700 }}>{done}/{total}</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 500ms ease" }} />
      </div>
    </div>
  );
}
