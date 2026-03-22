"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useZoloStore } from "@/lib/store";

export default function Root() {
  const router = useRouter();
  const profile = useZoloStore((s) => s.profile);

  useEffect(() => {
    if (profile?.onboardingComplete) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [profile, router]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, color: "var(--lime)", textShadow: "0 0 40px var(--lime)60" }}>
        ZOLO
      </div>
    </div>
  );
}
