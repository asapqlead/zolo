"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useZoloStore, getVibeColor, XP_EARN } from "@/lib/store";
import VibeScore from "@/components/ui/VibeScore";
import XPBar from "@/components/ui/XPBar";
import EnergyForecast from "@/components/features/EnergyForecast";
import BedtimeHandoff from "@/components/features/BedtimeHandoff";
import AllClearModal from "@/components/features/AllClearModal";
import { useConfetti } from "@/lib/useConfetti";
import StreakMilestoneBanner, { useStreakMilestone } from "@/components/features/StreakMilestone";
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
    const [bh, bm] = profile.bedTime.split(":").map(Number);
    const [wh] = profile.wakeTime.split(":").map(Number);
    const bufferStart = bh * 60 - profile.bufferMinutes;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    // Show bedtime handoff within the buffer window on actual evening hours
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
    updateTaskDecay, addXP, checkDayStreak } = store;
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
      setFocusSeconds((s) => {
        if (s + 1 >= focusTarget) {
          setFocusActive(false);
          setFocusDone(true);
          fire({ type: "mild" });
          return focusTarget;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [focusActive, focusTarget]);

  // All-clear detection
  const todayTasks = getTodayTasks();
  const allDone = todayTasks.length > 0 && todayTasks.every((t) => t.completed);
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      prevAllDoneRef.current = true;
      addXP(XP_EARN.allTasksBonus);
      setShowAllClear(true);
      fire({ type: "burst" });
    }
    if (!allDone) prevAllDoneRef.current = false;
  }, [allDone]);

  const showXPToast = useCallback((amount: number) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, amount, x: Math.random() * 50 + 25 }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1200);
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
  const tasksLeft = todayTasks.filter((t) => !t.completed).length;
  const habitsLeft = todayHabits.filter((h) => !h.completedDates.includes(today)).length;
  const focusMins = Math.floor(focusSeconds / 60);
  const focusSecs = focusSeconds % 60;
  const focusPct = Math.min(focusSeconds / focusTarget, 1);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* XP Toasts */}
      {toasts.map((t) => (
        <div key={t.id} style={{
          position: "fixed", top: "28%", left: `${t.x}%`,
          zIndex: 999, fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 24, color: "var(--lime)", textShadow: "0 0 20px var(--lime)",
          pointerEvents: "none", animation: "xp-fly 1.1s ease-out forwards",
        }}>+{t.amount} XP</div>
      ))}

      {/* Modals */}
      {showBedtime && <BedtimeHandoff onClose={() => setShowBedtime(false)} />}
      {showAllClear && <AllClearModal vibeScore={vibeScore} onClose={() => setShowAllClear(false)} />
      }
      {milestone && <StreakMilestoneBanner streak={milestone} onDismiss={dismissMilestone} />}

      {/* Header */}
      <div style={{
        padding: "52px 20px 20px",
        background: "linear-gradient(180deg, var(--surface) 0%, transparent 100%)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 2 }}>
              {format(new Date(), "EEEE, MMM d")}
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>
              gm, {profile.name} 👋
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--amber)15", border: "1px solid var(--amber)40", borderRadius: 20, padding: "6px 12px" }}>
              <Flame size={15} color="var(--amber)" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--amber)", fontSize: 15 }}>{dayStreak}</span>
            </div>
            <button onClick={() => setShowBedtime(true)}
              title="bedtime handoff"
              style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--purple)15", border: "1px solid var(--purple)40", borderRadius: 20, padding: "6px 12px", cursor: "pointer", color: "var(--purple)" }}>
              <Moon size={15} />
            </button>
          </div>
        </div>
        <XPBar totalXP={totalXP} compact />
      </div>

      <div style={{ padding: "16px 20px 0" }}>

        {/* Vibe + Energy row */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, marginBottom: 14, alignItems: "stretch" }}>
          {/* Vibe score card */}
          <div style={{
            background: "var(--surface)",
            border: `1px solid ${vibeColor}30`,
            borderRadius: 20, padding: "18px 16px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 30px ${vibeColor}10`,
          }}>
            <VibeScore score={vibeScore} size={110} />
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
              <MiniStat label="tasks" done={todayTasks.filter(t => t.completed).length} total={todayTasks.length} color="var(--cyan)" />
              <MiniStat label="habits" done={todayHabits.filter(h => h.completedDates.includes(today)).length} total={todayHabits.length} color="var(--lime)" />
            </div>
          </div>

          {/* Energy forecast */}
          <div style={{ minWidth: 0 }}>
            <EnergyForecast profile={profile} />
          </div>
        </div>

        {/* Decay Alert */}
        {decaying.length > 0 && (
          <div className="animate-slide-up" style={{ marginBottom: 14 }}>
            <div onClick={() => router.push("/tasks")} style={{
              background: "var(--pink)10", border: "1px solid var(--pink)50",
              borderRadius: 14, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
            }}>
              <AlertTriangle size={16} color="var(--pink)" className="animate-pulse-slow" />
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--pink)", fontWeight: 700, fontSize: 13 }}>
                  {decaying.length} goal{decaying.length > 1 ? "s" : ""} decaying
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>tap to rescue them</div>
              </div>
              <span style={{ color: "var(--pink)" }}>→</span>
            </div>
          </div>
        )}

        {/* Focus Session */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            background: focusActive ? "var(--purple)15" : focusDone ? "var(--lime)10" : "var(--surface)",
            border: `1px solid ${focusActive ? "var(--purple)" : focusDone ? "var(--lime)50" : "var(--border)"}`,
            borderRadius: 16, padding: "14px", transition: "all 0.3s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: focusActive ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Timer size={15} color={focusActive ? "var(--purple)" : focusDone ? "var(--lime)" : "var(--text-muted)"} />
                <span style={{ fontWeight: 600, fontSize: 13, color: focusActive ? "var(--text)" : focusDone ? "var(--lime)" : "var(--text-muted)" }}>
                  {focusDone ? `session complete! +${XP_EARN.focusSession} XP` : focusActive ? "locked in 🔒" : "lock in mode"}
                </span>
              </div>
              {focusActive && (
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--purple)" }}>
                  {String(focusMins).padStart(2, "0")}:{String(focusSecs).padStart(2, "0")}
                </div>
              )}
            </div>
            {focusActive && (
              <div style={{ height: 4, background: "var(--surface2)", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${focusPct * 100}%`, background: "var(--purple)", transition: "width 1s linear", boxShadow: "0 0 8px var(--purple)" }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {!focusActive && !focusDone ? (
                [25, 45, 60].map((m) => (
                  <button key={m} onClick={() => { setFocusTarget(m * 60); setFocusSeconds(0); setFocusActive(true); setFocusDone(false); }}
                    style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px 4px", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {m}m
                  </button>
                ))
              ) : focusActive ? (
                <button onClick={() => {
                  setFocusActive(false);
                  if (focusSeconds >= 25 * 60) { addXP(XP_EARN.focusSession); setFocusDone(true); fire({ type: "mild" }); showXPToast(XP_EARN.focusSession); }
                  else { setFocusSeconds(0); }
                }}
                  style={{ flex: 1, background: "var(--purple)", border: "none", borderRadius: 9, padding: "9px", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  end session
                </button>
              ) : (
                <button onClick={() => { setFocusDone(false); setFocusSeconds(0); }}
                  style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9, padding: "9px", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  start another
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Today's Quests */}
        <section style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }}>today's quests</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {tasksLeft > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{tasksLeft} left</span>}
              <button onClick={() => router.push("/tasks")}
                style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <Plus size={11} /> add
              </button>
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 16 }}>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>no quests yet today</p>
              <button onClick={() => router.push("/tasks")}
                style={{ background: "var(--lime)", color: "var(--bg)", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                add quests ⚡
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {todayTasks.slice(0, 5).map((task) => {
                const pColor = task.priority === "high" ? "var(--pink)" : task.priority === "medium" ? "var(--amber)" : "var(--text-muted)";
                const xpAmt = task.priority === "high" ? 150 : task.priority === "medium" ? 100 : 50;
                const decayGlow = task.decayState === "critical" ? "var(--pink)60" : task.decayState === "decaying" ? "var(--pink)30" : "transparent";
                return (
                  <div key={task.id} style={{
                    background: task.completed ? "var(--surface)60" : "var(--surface)",
                    border: `1.5px solid ${task.decayState === "critical" ? "var(--red)" : task.decayState === "decaying" ? "var(--pink)60" : task.decayState === "at-risk" ? "var(--amber)50" : "var(--border)"}`,
                    borderRadius: 13, padding: "11px 13px",
                    display: "flex", alignItems: "center", gap: 11,
                    opacity: task.completed ? 0.5 : 1, transition: "all 0.2s",
                    boxShadow: task.completed ? "none" : `0 0 12px ${decayGlow}`,
                  }}>
                    <button onClick={() => !task.completed && handleCompleteTask(task.id)}
                      style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${task.completed ? "var(--lime)" : pColor}`, background: task.completed ? "var(--lime)" : "transparent", cursor: task.completed ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                      {task.completed && <span style={{ color: "var(--bg)", fontSize: 11, fontWeight: 800 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "var(--text-muted)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.title}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: pColor, fontWeight: 600, textTransform: "uppercase" }}>{task.priority}</span>
                        {!task.completed && <span style={{ fontSize: 10, color: "var(--text-dim)" }}>+{xpAmt}XP</span>}
                        {task.decayState === "decaying" && <span className="animate-pulse-slow" style={{ fontSize: 10, color: "var(--pink)", fontWeight: 600 }}>🔥 decaying</span>}
                        {task.decayState === "critical" && <span className="animate-pulse-slow" style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>💀 critical</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {todayTasks.length > 5 && (
                <button onClick={() => router.push("/tasks")}
                  style={{ background: "transparent", border: "1px dashed var(--border)", borderRadius: 13, padding: "9px", color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}>
                  +{todayTasks.length - 5} more →
                </button>
              )}
            </div>
          )}
        </section>

        {/* Today's Habits */}
        {todayHabits.length > 0 && (
          <section style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }}>habits</h2>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{habitsLeft} left</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {todayHabits.map((habit) => {
                const done = habit.completedDates.includes(today);
                return (
                  <div key={habit.id} style={{
                    background: done ? "var(--lime)08" : "var(--surface)",
                    border: `1.5px solid ${done ? "var(--lime)30" : "var(--border)"}`,
                    borderRadius: 13, padding: "11px 13px",
                    display: "flex", alignItems: "center", gap: 11,
                    opacity: done ? 0.65 : 1, transition: "all 0.3s",
                  }}>
                    <span style={{ fontSize: 20 }}>{habit.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, textDecoration: done ? "line-through" : "none", color: done ? "var(--text-muted)" : "var(--text)" }}>{habit.name}</div>
                      {habit.streak > 0 && <span style={{ fontSize: 10, color: "var(--amber)", fontWeight: 600 }}>🔥 {habit.streak}d</span>}
                    </div>
                    <button onClick={() => !done && handleCompleteHabit(habit.id)} disabled={done}
                      style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${done ? "var(--lime)" : "var(--border)"}`, background: done ? "var(--lime)" : "transparent", cursor: done ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                      {done && <span style={{ color: "var(--bg)", fontSize: 13, fontWeight: 800 }}>✓</span>}
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
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{label}</span>
        <span style={{ fontSize: 10, color, fontWeight: 600 }}>{done}/{total}</span>
      </div>
      <div style={{ height: 3, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}
