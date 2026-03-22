"use client";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { hasSupabase } from "@/lib/supabase";
import { pullFromSupabase, pushToSupabase, schedulePush, getUserId } from "@/lib/sync";
import { useZoloStore } from "@/lib/store";
import type { SyncStatus } from "@/lib/sync";

interface SyncCtx {
  status: SyncStatus;
  lastSynced: Date | null;
  forcePush: () => Promise<void>;
  userId: string;
}

const SyncContext = createContext<SyncCtx>({
  status: "idle",
  lastSynced: null,
  forcePush: async () => {},
  userId: "",
});

export function useSyncStatus() {
  return useContext(SyncContext);
}

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [userId, setUserId] = useState("");
  const [pulled, setPulled] = useState(false);

  // On mount: get user ID + pull from Supabase
  useEffect(() => {
    if (typeof window === "undefined") return;
    const uid = getUserId();
    setUserId(uid);

    if (!hasSupabase) {
      setPulled(true);
      return;
    }

    setStatus("syncing");
    pullFromSupabase()
      .then(({ ok, error }) => {
        if (ok) {
          setStatus("synced");
          setLastSynced(new Date());
        } else {
          console.warn("[zolo] initial pull failed:", error);
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"))
      .finally(() => setPulled(true));
  }, []);

  // Subscribe to store changes → schedule a push
  useEffect(() => {
    if (!pulled || !hasSupabase) return;

    const unsub = useZoloStore.subscribe(() => {
      setStatus("syncing");
      schedulePush(1200);
      // Mark synced after debounce settles (rough estimate)
      setTimeout(() => {
        setStatus("synced");
        setLastSynced(new Date());
      }, 2200);
    });

    return () => unsub();
  }, [pulled]);

  const forcePush = useCallback(async () => {
    if (!hasSupabase) return;
    setStatus("syncing");
    const { ok } = await pushToSupabase();
    setStatus(ok ? "synced" : "error");
    if (ok) setLastSynced(new Date());
  }, []);

  return (
    <SyncContext.Provider value={{ status, lastSynced, forcePush, userId }}>
      {children}
    </SyncContext.Provider>
  );
}
