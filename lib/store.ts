import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, differenceInDays } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Priority = "low" | "medium" | "high";
export type DecayState = "healthy" | "at-risk" | "decaying" | "critical" | "archived";
export type EnergyZone = "peak" | "active" | "low" | "rest";
export type HabitCategory = "Mindset" | "Health" | "Learning" | "Social" | "Deep Work" | "Custom";
export type VibeLabel = "locked in" | "solid day" | "mid tbh" | "rough patch" | "reset needed";

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  date: string; // YYYY-MM-DD
  completedAt?: string;
  createdAt: string;
  decayState: DecayState;
  xpEarned?: number;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  frequency: "daily" | "weekdays" | "weekends";
  streak: number;
  longestStreak: number;
  completedDates: string[];
  reminderTime?: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  startedAt: string;
  duration: number; // minutes
  completed: boolean;
}

export interface DailyStats {
  date: string;
  vibeScore: number;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  focusMinutes: number;
  xpEarned: number;
  xpLost: number;
}

export interface UserProfile {
  name: string;
  wakeTime: string; // "07:00"
  bedTime: string;  // "23:00"
  bufferMinutes: number;
  energyProfile: {
    morningPerson: boolean;
    focusSessionLength: number; // minutes
    peakHours: number[]; // 0-23
  };
  onboardingComplete: boolean;
  createdAt: string;
}

export interface WeeklyReflection {
  weekStart: string;
  content: string;
  generatedAt: string;
}

// ── XP Config ─────────────────────────────────────────────────────────────────

export const XP_EARN = {
  taskLow: 50,
  taskMedium: 100,
  taskHigh: 150,
  habit: 40,
  focusSession: 80,
  streak7: 200,
  streak30: 500,
  allTasksBonus: 100,
  proactivePlanning: 20,
} as const;

export const XP_PENALTY = {
  taskLow: 20,
  taskMedium: 40,
  taskHigh: 60,
  streakBreak: 150,
  goalDecay: 30,
} as const;

export const LEVEL_THRESHOLDS = [
  { min: 1, max: 10, xpPerLevel: 500 },
  { min: 11, max: 25, xpPerLevel: 800 },
  { min: 26, max: 50, xpPerLevel: 1200 },
  { min: 51, max: 100, xpPerLevel: 2000 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calculateLevel(totalXP: number): { level: number; xpInLevel: number; xpForNext: number } {
  let xp = totalXP;
  let level = 1;

  for (const tier of LEVEL_THRESHOLDS) {
    for (let l = tier.min; l <= tier.max; l++) {
      if (xp < tier.xpPerLevel) {
        return { level, xpInLevel: xp, xpForNext: tier.xpPerLevel };
      }
      xp -= tier.xpPerLevel;
      level++;
    }
  }
  return { level: 100, xpInLevel: 0, xpForNext: 2000 };
}

export function calculateVibeScore(
  tasksCompleted: number,
  tasksTotal: number,
  habitsCompleted: number,
  habitsTotal: number,
  focusMinutes: number,
  decayingGoals: number
): number {
  const habitRate = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 30 : 30;
  const taskRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 30 : 30;
  const focusScore = Math.min(focusMinutes / 120, 1) * 20;
  const decayPenalty = Math.min(decayingGoals * 5, 20);
  return Math.max(0, Math.min(100, Math.round(habitRate + taskRate + focusScore - decayPenalty)));
}

export function getVibeLabel(score: number): VibeLabel {
  if (score >= 90) return "locked in";
  if (score >= 70) return "solid day";
  if (score >= 50) return "mid tbh";
  if (score >= 30) return "rough patch";
  return "reset needed";
}

export function getVibeColor(score: number): string {
  if (score >= 90) return "#C8FF00";
  if (score >= 70) return "#00F5D4";
  if (score >= 50) return "#FFB703";
  if (score >= 30) return "#F72585";
  return "#FF4444";
}

export function getDecayState(task: Task): DecayState {
  if (task.completed || task.decayState === "archived") return task.decayState;
  const taskDate = new Date(task.date);
  const now = new Date();
  const daysPast = differenceInDays(now, taskDate);
  if (daysPast <= 0) return "healthy";
  if (daysPast === 1) return "at-risk";
  if (daysPast <= 3) return "decaying";
  return "critical";
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ZoloState {
  // Core data
  profile: UserProfile | null;
  tasks: Task[];
  habits: Habit[];
  focusSessions: FocusSession[];
  dailyStats: DailyStats[];
  reflections: WeeklyReflection[];

  // Ephemeral
  totalXP: number;
  dayStreak: number;
  lastStreakDate: string | null;

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  addTask: (task: Omit<Task, "id" | "createdAt" | "decayState">) => void;
  completeTask: (id: string) => { xpGained: number };
  deleteTask: (id: string) => void;
  archiveTask: (id: string) => void;
  rescheduleTask: (id: string, newDate: string) => void;
  updateTaskDecay: () => void;

  addHabit: (habit: Omit<Habit, "id" | "streak" | "longestStreak" | "completedDates" | "createdAt">) => void;
  completeHabit: (id: string) => { xpGained: number };
  deleteHabit: (id: string) => void;

  addFocusSession: (session: Omit<FocusSession, "id">) => { xpGained: number };

  addReflection: (reflection: WeeklyReflection) => void;

  addXP: (amount: number) => void;
  deductXP: (amount: number) => void;
  checkDayStreak: () => void;

  getTodayTasks: () => Task[];
  getTodayHabits: () => Habit[];
  getTodayVibeScore: () => number;
  getDecayingTasks: () => Task[];
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export const useZoloStore = create<ZoloState>()(
  persist(
    (set, get) => ({
      profile: null,
      tasks: [],
      habits: [],
      focusSessions: [],
      dailyStats: [],
      reflections: [],
      totalXP: 0,
      dayStreak: 0,
      lastStreakDate: null,

      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...updates } : null })),

      addTask: (task) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              ...task,
              id: generateId(),
              createdAt: new Date().toISOString(),
              decayState: "healthy",
            },
          ],
        })),

      completeTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.completed) return { xpGained: 0 };

        const xpMap = { low: XP_EARN.taskLow, medium: XP_EARN.taskMedium, high: XP_EARN.taskHigh };
        const xpGained = xpMap[task.priority];

        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, completed: true, completedAt: new Date().toISOString(), xpEarned: xpGained, decayState: "healthy" }
              : t
          ),
          totalXP: s.totalXP + xpGained,
        }));

        return { xpGained };
      },

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      archiveTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, decayState: "archived" } : t)),
        })),

      rescheduleTask: (id, newDate) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, date: newDate, decayState: "healthy" } : t
          ),
        })),

      updateTaskDecay: () =>
        set((s) => ({
          tasks: s.tasks.map((t) => ({ ...t, decayState: getDecayState(t) })),
        })),

      addHabit: (habit) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              ...habit,
              id: generateId(),
              streak: 0,
              longestStreak: 0,
              completedDates: [],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      completeHabit: (id) => {
        const today = todayStr();
        const habit = get().habits.find((h) => h.id === id);
        if (!habit || habit.completedDates.includes(today)) return { xpGained: 0 };

        const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
        const newStreak = habit.completedDates.includes(yesterday) ? habit.streak + 1 : 1;

        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  completedDates: [...h.completedDates, today],
                  streak: newStreak,
                  longestStreak: Math.max(h.longestStreak, newStreak),
                }
              : h
          ),
          totalXP: s.totalXP + XP_EARN.habit,
        }));

        return { xpGained: XP_EARN.habit };
      },

      deleteHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      addFocusSession: (session) => {
        const xpGained = session.completed && session.duration >= 25 ? XP_EARN.focusSession : 0;
        set((s) => ({
          focusSessions: [
            ...s.focusSessions,
            { ...session, id: generateId() },
          ],
          totalXP: s.totalXP + xpGained,
        }));
        return { xpGained };
      },

      addReflection: (reflection) =>
        set((s) => ({ reflections: [reflection, ...s.reflections] })),

      addXP: (amount) => set((s) => ({ totalXP: s.totalXP + amount })),
      deductXP: (amount) => set((s) => ({ totalXP: Math.max(0, s.totalXP - amount) })),

      checkDayStreak: () => {
        const today = todayStr();
        const { lastStreakDate, dayStreak } = get();
        if (lastStreakDate === today) return;
        const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
        const newStreak = lastStreakDate === yesterday ? dayStreak + 1 : 1;
        set({ dayStreak: newStreak, lastStreakDate: today });
      },

      getTodayTasks: () => {
        const today = todayStr();
        return get().tasks.filter((t) => t.date === today && t.decayState !== "archived");
      },

      getTodayHabits: () => {
        const today = todayStr();
        const dow = new Date().getDay();
        return get().habits.filter((h) => {
          if (h.frequency === "daily") return true;
          if (h.frequency === "weekdays") return dow >= 1 && dow <= 5;
          if (h.frequency === "weekends") return dow === 0 || dow === 6;
          return true;
        });
      },

      getTodayVibeScore: () => {
        const state = get();
        const todayTasks = state.getTodayTasks();
        const todayHabits = state.getTodayHabits();
        const today = todayStr();
        const todayFocus = state.focusSessions
          .filter((s) => s.startedAt.startsWith(today) && s.completed)
          .reduce((sum, s) => sum + s.duration, 0);
        const decaying = todayTasks.filter(
          (t) => !t.completed && (t.decayState === "decaying" || t.decayState === "critical")
        ).length;
        return calculateVibeScore(
          todayTasks.filter((t) => t.completed).length,
          todayTasks.length,
          todayHabits.filter((h) => h.completedDates.includes(today)).length,
          todayHabits.length,
          todayFocus,
          decaying
        );
      },

      getDecayingTasks: () =>
        get().tasks.filter(
          (t) => !t.completed && (t.decayState === "decaying" || t.decayState === "critical" || t.decayState === "at-risk")
        ),
    }),
    {
      name: "zolo-storage",
      version: 1,
    }
  )
);
