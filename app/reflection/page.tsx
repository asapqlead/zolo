"use client";
import { useState } from "react";
import { useZoloStore, getVibeColor, getVibeLabel, calculateLevel } from "@/lib/store";
import { Sparkles, RefreshCw, TrendingUp, Zap, Target, Clock } from "lucide-react";
import { format, subDays, startOfWeek, eachDayOfInterval, endOfWeek } from "date-fns";

export default function ReflectionPage() {
  const { tasks, habits, focusSessions, reflections, addReflection, totalXP, dayStreak } = useZoloStore();
  const [loading, setLoading] = useState(false);

  const { level } = calculateLevel(totalXP);

  // ── Week data ──────────────────────────────────────────────────────────────
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: today });

  const weekStats = weekDays.map(day => {
    const d = format(day, "yyyy-MM-dd");
    const dayTasks = tasks.filter(t => t.date === d);
    const done = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    const focusMins = focusSessions
      .filter(s => s.startedAt.startsWith(d) && s.completed)
      .reduce((sum, s) => sum + s.duration, 0);
    const habitsCompleted = habits.filter(h => h.completedDates.includes(d)).length;

    // Mini vibe score for that day
    const habitRate = habits.length > 0 ? (habitsCompleted / habits.length) * 30 : 30;
    const taskRate = total > 0 ? (done / total) * 30 : (d === format(today,"yyyy-MM-dd") ? 15 : 30);
    const focusScore = Math.min(focusMins / 120, 1) * 20;
    const vibe = Math.round(Math.min(100, habitRate + taskRate + focusScore));

    return { date: d, label: format(day, "EEE"), done, total, vibe, focusMins, habitsCompleted };
  });

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(today, 6 - i), "yyyy-MM-dd");
    return d;
  });
  const totalTasksDone = tasks.filter(t => last7.includes(t.date) && t.completed).length;
  const totalTasksSet  = tasks.filter(t => last7.includes(t.date)).length;
  const totalFocusMins = focusSessions
    .filter(s => last7.some(d => s.startedAt.startsWith(d)) && s.completed)
    .reduce((sum, s) => sum + s.duration, 0);
  const completionRate = totalTasksSet > 0 ? Math.round((totalTasksDone / totalTasksSet) * 100) : 0;
  const bestHabit = [...habits].sort((a, b) => b.streak - a.streak)[0];
  const avgVibe = weekStats.length > 0 ? Math.round(weekStats.reduce((s, d) => s + d.vibe, 0) / weekStats.length) : 0;

  // ── Gemini/Claude reflection ───────────────────────────────────────────────
  async function generateReflection() {
    setLoading(true);
    const prompt = `You are Zolo, a Gen Z productivity companion. Write a weekly reflection for this user:

Stats (last 7 days):
- Tasks completed: ${totalTasksDone}/${totalTasksSet} (${completionRate}% rate)  
- Focus time: ${totalFocusMins} minutes total
- Active habits: ${habits.length}
- Best streak: ${bestHabit ? `${bestHabit.icon} ${bestHabit.name} — ${bestHabit.streak} days` : "none yet"}
- Total XP: ${totalXP.toLocaleString()} (Level ${level})
- Day streak: ${dayStreak} days
- Avg vibe score this week: ${avgVibe}/100

Write in this exact format (use the headers literally):
## the week in 2 sentences
[2 honest sentences, casual Gen Z tone]

## what was solid 🟢
[1-2 bullet points of genuine highlights]

## what slipped 🔶  
[1-2 bullet points, constructive not shaming]

## next week's plays 🎯
[exactly 3 short actionable bullet points]

Rules: under 220 words, sound like a smart friend not a coach, use emojis sparingly, never say "productivity" or "optimize".`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error("api failed");
      const data = await res.json();
      const text = data.content?.find((b: any) => b.type === "text")?.text || "";
      addReflection({ weekStart: format(weekStart, "yyyy-MM-dd"), content: text, generatedAt: new Date().toISOString() });
    } catch {
      // Fallback template
      const fallback = `## the week in 2 sentences
${completionRate >= 70 ? `You finished ${completionRate}% of your quests this week — that's actually solid.` : `${completionRate}% completion rate this week — not your best, but you're still in the game.`} ${totalFocusMins > 0 ? `${totalFocusMins} minutes of focus time logged, which is real work.` : "No focus sessions logged yet — that's the next unlock."}

## what was solid 🟢
${bestHabit ? `- Your ${bestHabit.icon} ${bestHabit.name} habit is on a ${bestHabit.streak}-day streak. That's the compound interest right there.` : "- You showed up and tracked things. That's step one."}
${totalTasksDone > 0 ? `- Got ${totalTasksDone} quest${totalTasksDone !== 1 ? "s" : ""} across the finish line.` : "- Set some habits and started building the system."}

## what slipped 🔶
${totalTasksSet - totalTasksDone > 0 ? `- ${totalTasksSet - totalTasksDone} task${totalTasksSet - totalTasksDone !== 1 ? "s" : ""} didn't make it. Check if they're still relevant before rescheduling.` : "- Nothing major slipped — keep that energy."}
${totalFocusMins < 60 ? "- Focus sessions were light. Even one 25-min lock-in per day moves the needle." : ""}

## next week's plays 🎯
- Cap yourself at 5 tasks per day max — quality over quantity
- ${dayStreak > 0 ? `Protect that ${dayStreak}-day streak — it's worth defending` : "Build a 3-day habit streak before adding new ones"}
- Before adding a new task, ask: does this actually matter this week?`;
      addReflection({ weekStart: format(weekStart, "yyyy-MM-dd"), content: fallback, generatedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }

  const latest = reflections[0];

  // Simple markdown-like renderer
  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <div key={i} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--text)", marginTop: i === 0 ? 0 : 18, marginBottom: 6 }}>{line.slice(3)}</div>;
      }
      if (line.startsWith("- ")) {
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "var(--lime)", marginTop: 1, flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{line.slice(2)}</span>
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} style={{ height: 4 }} />;
      return <p key={i} style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, marginBottom: 4 }}>{line}</p>;
    });
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", padding: "20px 16px 20px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>reflect</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>week of {format(weekStart, "MMM d")}</p>
        </div>
        <button onClick={generateReflection} disabled={loading}
          style={{ background: loading ? "var(--surface2)" : "var(--purple)", color: "white", border: "none", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 0 20px var(--purple)50", transition: "all 0.3s" }}>
          {loading
            ? <><RefreshCw size={15} className="animate-spin" /> generating...</>
            : <><Sparkles size={15} /> generate</>}
        </button>
      </div>

      {/* Weekly vibe chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13 }}>this week's vibes</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>avg <span style={{ color: getVibeColor(avgVibe), fontWeight: 700 }}>{avgVibe}</span></span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 64 }}>
          {weekStats.map(day => {
            const barH = Math.max(4, (day.vibe / 100) * 64);
            const color = getVibeColor(day.vibe);
            const isToday = day.date === format(new Date(), "yyyy-MM-dd");
            return (
              <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 64, gap: 4 }}>
                <div style={{ fontSize: 9, color: color, fontWeight: 700, opacity: day.vibe > 0 ? 1 : 0 }}>{day.vibe > 0 ? day.vibe : ""}</div>
                <div style={{
                  width: "100%", height: barH,
                  background: day.vibe === 0 ? "var(--surface2)" : color,
                  borderRadius: "4px 4px 2px 2px",
                  boxShadow: isToday ? `0 0 10px ${color}80` : "none",
                  border: isToday ? `1px solid ${color}` : "none",
                  transition: "height 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                  opacity: day.vibe === 0 ? 0.3 : 1,
                }} />
                <div style={{ fontSize: 9, color: isToday ? "var(--lime)" : "var(--text-dim)", fontWeight: isToday ? 700 : 400 }}>{day.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "tasks done", value: `${totalTasksDone}/${totalTasksSet}`, sub: `${completionRate}% rate`, icon: <Target size={14} />, color: "var(--cyan)" },
          { label: "focus logged", value: `${totalFocusMins}m`, sub: totalFocusMins >= 60 ? `${Math.floor(totalFocusMins/60)}h ${totalFocusMins%60}m` : "keep going", icon: <Clock size={14} />, color: "var(--purple)" },
          { label: "total XP", value: totalXP.toLocaleString(), sub: `level ${level}`, icon: <Zap size={14} />, color: "var(--lime)" },
          { label: "day streak", value: `${dayStreak}`, sub: dayStreak > 0 ? "🔥 keep it going" : "start one today", icon: <TrendingUp size={14} />, color: "var(--amber)" },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: card.color, marginBottom: 8 }}>
              {card.icon}
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{card.label}</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: card.color, lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Habit streaks */}
      {habits.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>habit streaks</div>
          {[...habits].sort((a,b) => b.streak - a.streak).slice(0,6).map(h => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</span>
                  <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>🔥 {h.streak}d</span>
                </div>
                <div style={{ height: 3, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${h.longestStreak > 0 ? Math.min((h.streak/h.longestStreak)*100,100) : 0}%`, background: "var(--amber)", borderRadius: 2, transition: "width 0.7s ease" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reflection output */}
      {!latest && !loading && (
        <div style={{ textAlign: "center", padding: "36px 0" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🤖</div>
          <p style={{ color: "var(--text-muted)", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>no reflection yet this week</p>
          <p style={{ color: "var(--text-dim)", fontSize: 12, lineHeight: 1.6, marginBottom: 22 }}>
            Hit Generate to get your AI-powered weekly recap.<br />It gets smarter the more you log.
          </p>
          <button onClick={generateReflection} disabled={loading}
            style={{ background: "var(--purple)", color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 0 20px var(--purple)50" }}>
            <Sparkles size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            generate reflection
          </button>
        </div>
      )}

      {latest && (
        <div className="animate-slide-up" style={{ background: "var(--surface)", border: "1px solid var(--purple)40", borderRadius: 16, padding: "18px 16px", marginBottom: 14, boxShadow: "0 0 40px var(--purple)08" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Sparkles size={14} color="var(--purple)" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "var(--purple)", textTransform: "uppercase", letterSpacing: 1 }}>AI REFLECTION</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)" }}>{format(new Date(latest.generatedAt), "MMM d, h:mma")}</span>
          </div>
          <div>{renderContent(latest.content)}</div>
        </div>
      )}

      {/* Past reflections */}
      {reflections.length > 1 && (
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>past reflections</div>
          {reflections.slice(1, 4).map((r, i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>week of {r.weekStart}</div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {r.content.replace(/##[^\n]*/g, "").replace(/- /g, "").slice(0, 200)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
