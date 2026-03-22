"use client";
import { useState } from "react";
import { useZoloStore, Task } from "@/lib/store";
import { format, addDays } from "date-fns";
import { Moon, RotateCcw, Clock, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

type Decision = "move" | "keep" | "dismiss";

export default function BedtimeHandoff({ onClose }: Props) {
  const { getTodayTasks, rescheduleTask, archiveTask, addXP } = useZoloStore();
  const incompleteTasks = getTodayTasks().filter((t) => !t.completed);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [done, setDone] = useState(false);

  function decide(id: string, dec: Decision) {
    setDecisions((prev) => ({ ...prev, [id]: dec }));
  }

  function finish() {
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    let movedCount = 0;
    incompleteTasks.forEach((t) => {
      const dec = decisions[t.id] || "keep";
      if (dec === "move") { rescheduleTask(t.id, tomorrow); movedCount++; }
      else if (dec === "dismiss") { archiveTask(t.id); }
    });
    if (movedCount > 0) addXP(20); // proactive planning bonus
    setDone(true);
    setTimeout(onClose, 2200);
  }

  const allDecided = incompleteTasks.every((t) => decisions[t.id]);

  const decBg: Record<Decision, string> = {
    move: "var(--cyan)20",
    keep: "var(--amber)15",
    dismiss: "var(--pink)15",
  };
  const decBorder: Record<Decision, string> = {
    move: "var(--cyan)",
    keep: "var(--amber)",
    dismiss: "var(--pink)",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end",
    }}>
      <div className="animate-slide-up" style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: "var(--surface)",
        borderRadius: "24px 24px 0 0",
        border: "1px solid var(--border)",
        borderBottom: "none",
        padding: "24px 20px 40px",
        maxHeight: "85dvh",
        overflowY: "auto",
      }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🌙</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
              goodnight ✨
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              streak's safe — see you tomorrow
            </div>
            {Object.values(decisions).filter((d) => d === "move").length > 0 && (
              <div style={{ color: "var(--lime)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                +20 XP for proactive planning 🎯
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Moon size={18} color="var(--purple)" />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>winding down?</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5 }}>
                  you've got {incompleteTasks.length} quest{incompleteTasks.length !== 1 ? "s" : ""} left. what do you want to do with them?
                </p>
              </div>
              <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {incompleteTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <p style={{ color: "var(--lime)", fontWeight: 700 }}>all clear — you crushed it today!</p>
              </div>
            ) : (
              <>
                {/* Task decisions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {incompleteTasks.map((task) => {
                    const dec = decisions[task.id];
                    const priorityColor = task.priority === "high" ? "var(--pink)" : task.priority === "medium" ? "var(--amber)" : "var(--text-muted)";
                    return (
                      <div key={task.id} style={{
                        background: dec ? decBg[dec] : "var(--surface2)",
                        border: `1.5px solid ${dec ? decBorder[dec] : "var(--border)"}`,
                        borderRadius: 14, padding: "12px 14px",
                        transition: "all 0.25s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColor, flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{task.title}</span>
                          <span style={{ fontSize: 10, color: priorityColor, textTransform: "uppercase", fontWeight: 700 }}>{task.priority}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {([
                            ["move", "move to tomorrow", RotateCcw, "var(--cyan)"],
                            ["keep", "keep tonight", Clock, "var(--amber)"],
                            ["dismiss", "let it go", X, "var(--pink)"],
                          ] as [Decision, string, any, string][]).map(([d, label, Icon, color]) => (
                            <button key={d} onClick={() => decide(task.id, d)}
                              style={{
                                flex: 1,
                                background: dec === d ? `${color}30` : "transparent",
                                border: `1px solid ${dec === d ? color : "var(--border)"}`,
                                borderRadius: 8, padding: "7px 4px",
                                color: dec === d ? color : "var(--text-muted)",
                                fontSize: 10, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                                transition: "all 0.2s",
                              }}>
                              <Icon size={10} /> {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bulk actions */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button onClick={() => incompleteTasks.forEach((t) => decide(t.id, "move"))}
                    style={{ flex: 1, background: "var(--cyan)15", border: "1px solid var(--cyan)40", borderRadius: 10, padding: "10px", color: "var(--cyan)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    move all →
                  </button>
                  <button onClick={() => incompleteTasks.forEach((t) => decide(t.id, "dismiss"))}
                    style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    dismiss all
                  </button>
                </div>

                <button onClick={finish}
                  style={{
                    width: "100%",
                    background: "var(--purple)",
                    color: "white",
                    border: "none",
                    borderRadius: 14, padding: "14px",
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15,
                    cursor: "pointer",
                    boxShadow: "0 0 20px var(--purple)60",
                    transition: "all 0.2s",
                  }}>
                  done for tonight 🌙
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
