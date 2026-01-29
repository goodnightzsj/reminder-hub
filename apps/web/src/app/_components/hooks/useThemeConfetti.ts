"use client";

import { useEffect, useState, useCallback } from "react";
import { useTimeouts } from "../hooks/useTimeouts";
import { createMicroConfettiParticles, type MicroConfettiParticle } from "../MicroConfetti";

export function useThemeConfetti() {
  const [confetti, setConfetti] = useState<MicroConfettiParticle[]>([]);
  const { scheduleTimeout, cancelTimeout } = useTimeouts();

  // Cleanup old particles (garbage collection)
  useEffect(() => {
    if (confetti.length === 0) return;

    const timer = scheduleTimeout(() => setConfetti([]), 2000); // 清理足够旧的粒子
    return () => cancelTimeout(timer);
  }, [confetti, scheduleTimeout, cancelTimeout]);

  const triggerConfetti = useCallback((x: number, y: number, color: string) => {
    const newParticles = createMicroConfettiParticles(x, y, color);
    // Append new particles instead of replacing, allowing multiple bursts
    setConfetti((prev) => [...prev.slice(-50), ...newParticles]); // Keep last 50 to prevent overflow
  }, []);

  return { confetti, triggerConfetti };
}
