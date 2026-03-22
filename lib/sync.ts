import { supabase, hasSupabase } from "./supabase";
import { useZoloStore } from "./store";

// ── Anonymous user ID ─────────────────────────────────────────────────────────
// We generate a UUID on first load and persist it to localStorage.
// This is the user's permanent identity — no login required.

const USER_ID_KEY = "zolo-user-id";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

// ── Ensure user row exists ────────────────────────────────────────────────────
async function ensureUser(userId: string) {
  if (!supabase) return;
  const { data } = await supabase
    .from("zolo_users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!data) {
    await supabase.from("zolo_users").insert({ id: userId });
  }
}

// ── PUSH — write local state → Supabase ──────────────────────────────────────
export async function pushToSupabase(): Promise<{ ok: boolean; error?: string }> {
  if (!hasSupabase) return { ok: false, error: "Supabase not configured" };

  const userId = getUserId();
  const state = useZoloStore.getState();

  try {
    await ensureUser(userId);

    // 1. Update user profile + XP + streak
    await supabase!.from("zolo_users").upsert({
      id: userId,
      profile: state.profile,
      total_xp: state.totalXP,
      day_streak: state.dayStreak,
      last_streak_date: state.lastStreakDate,
    });

    // 2. Upsert tasks (batch)
    if (state.tasks.length > 0) {
      await supabase!.from("zolo_tasks").upsert(
        state.tasks.map(t => ({
          id: t.id,
          user_id: userId,
          title: t.title,
          priority: t.priority,
          completed: t.completed,
          date: t.date,
          completed_at: t.completedAt ?? null,
          created_at: t.createdAt,
          decay_state: t.decayState,
          xp_earned: t.xpEarned ?? null,
        })),
        { onConflict: "id" }
      );
    }

    // 3. Upsert habits (batch)
    if (state.habits.length > 0) {
      await supabase!.from("zolo_habits").upsert(
        state.habits.map(h => ({
          id: h.id,
          user_id: userId,
          name: h.name,
          icon: h.icon,
          category: h.category,
          frequency: h.frequency,
          streak: h.streak,
          longest_streak: h.longestStreak,
          completed_dates: h.completedDates,
          reminder_time: h.reminderTime ?? null,
          created_at: h.createdAt,
        })),
        { onConflict: "id" }
      );
    }

    // 4. Upsert focus sessions (batch)
    if (state.focusSessions.length > 0) {
      await supabase!.from("zolo_focus_sessions").upsert(
        state.focusSessions.map(s => ({
          id: s.id,
          user_id: userId,
          started_at: s.startedAt,
          duration: s.duration,
          completed: s.completed,
        })),
        { onConflict: "id" }
      );
    }

    // 5. Upsert reflections
    if (state.reflections.length > 0) {
      await supabase!.from("zolo_reflections").upsert(
        state.reflections.map(r => ({
          user_id: userId,
          week_start: r.weekStart,
          content: r.content,
          generated_at: r.generatedAt,
        })),
        { onConflict: "user_id,week_start" }
      );
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[zolo] push failed:", err);
    return { ok: false, error: err?.message ?? "Unknown error" };
  }
}

// ── PULL — read Supabase → overwrite local state ──────────────────────────────
export async function pullFromSupabase(): Promise<{ ok: boolean; error?: string; isNewUser?: boolean }> {
  if (!hasSupabase) return { ok: false, error: "Supabase not configured" };

  const userId = getUserId();

  try {
    // Fetch user row
    const { data: user } = await supabase!
      .from("zolo_users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!user) {
      // Brand new user — nothing to pull
      return { ok: true, isNewUser: true };
    }

    // Fetch all related data in parallel
    const [tasksRes, habitsRes, focusRes, reflectionsRes] = await Promise.all([
      supabase!.from("zolo_tasks").select("*").eq("user_id", userId),
      supabase!.from("zolo_habits").select("*").eq("user_id", userId),
      supabase!.from("zolo_focus_sessions").select("*").eq("user_id", userId),
      supabase!.from("zolo_reflections").select("*").eq("user_id", userId).order("generated_at", { ascending: false }),
    ]);

    const tasks = (tasksRes.data ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      completed: t.completed,
      date: t.date,
      completedAt: t.completed_at ?? undefined,
      createdAt: t.created_at,
      decayState: t.decay_state,
      xpEarned: t.xp_earned ?? undefined,
    }));

    const habits = (habitsRes.data ?? []).map((h: any) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      category: h.category,
      frequency: h.frequency,
      streak: h.streak,
      longestStreak: h.longest_streak,
      completedDates: h.completed_dates ?? [],
      reminderTime: h.reminder_time ?? undefined,
      createdAt: h.created_at,
    }));

    const focusSessions = (focusRes.data ?? []).map((s: any) => ({
      id: s.id,
      startedAt: s.started_at,
      duration: s.duration,
      completed: s.completed,
    }));

    const reflections = (reflectionsRes.data ?? []).map((r: any) => ({
      weekStart: r.week_start,
      content: r.content,
      generatedAt: r.generated_at,
    }));

    // Overwrite local Zustand store
    useZoloStore.setState({
      profile: user.profile ?? null,
      totalXP: user.total_xp ?? 0,
      dayStreak: user.day_streak ?? 0,
      lastStreakDate: user.last_streak_date ?? null,
      tasks,
      habits,
      focusSessions,
      reflections,
    });

    return { ok: true, isNewUser: false };
  } catch (err: any) {
    console.error("[zolo] pull failed:", err);
    return { ok: false, error: err?.message ?? "Unknown error" };
  }
}

// ── SYNC STATUS ───────────────────────────────────────────────────────────────
export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

// Debounced auto-push — call this after any state mutation
let pushTimer: ReturnType<typeof setTimeout> | null = null;
export function schedulePush(delayMs = 1500) {
  if (!hasSupabase) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushToSupabase().catch(() => {});
  }, delayMs);
}
