"use client";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", position: "relative" }}>
      <main style={{ paddingBottom: 80 }}>{children}</main>
      <BottomNav />
    </div>
  );
}
