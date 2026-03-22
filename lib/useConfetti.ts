"use client";
import { useCallback } from "react";

export function useConfetti() {
  const fire = useCallback(async (opts?: { type?: "burst" | "streak" | "mild" }) => {
    const confetti = (await import("canvas-confetti")).default;
    const type = opts?.type ?? "mild";

    if (type === "burst") {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#C8FF00", "#00F5D4", "#7B3FE4", "#FFB703"] });
      setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.2 }, colors: ["#C8FF00", "#F72585"] }), 200);
      setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5, x: 0.8 }, colors: ["#00F5D4", "#FFB703"] }), 400);
    } else if (type === "streak") {
      const end = Date.now() + 1200;
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#C8FF00", "#FFB703"] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#00F5D4", "#7B3FE4"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ["#C8FF00", "#00F5D4"] });
    }
  }, []);

  return { fire };
}
