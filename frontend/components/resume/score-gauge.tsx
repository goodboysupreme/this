"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Score band colors from design tokens: danger <50, warn 50-75, success >75. */
export function scoreColor(score: number): string {
  if (score < 50) return "oklch(var(--danger))";
  if (score <= 75) return "oklch(var(--warn))";
  return "oklch(var(--success))";
}

export function scoreLabel(score: number): string {
  if (score < 50) return "Needs work";
  if (score <= 75) return "Getting there";
  return "Strong";
}

export function ScoreGauge({
  score,
  size = 180,
  strokeWidth = 12,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(clamped);
  const reduce = useReducedMotion();

  const [display, setDisplay] = useState(() => (reduce ? clamped : 0));
  useEffect(() => {
    if (reduce) {
      setDisplay(clamped);
      return;
    }
    let frame: number;
    const start = performance.now();
    const duration = 250;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * clamped));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clamped, reduce]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-line"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="stat-num text-5xl font-semibold" style={{ color }}>
          {display}
        </span>
        <span className="text-xs uppercase tracking-wider text-muted">
          <span className="stat-num">/ 100</span> · {scoreLabel(clamped)}
        </span>
      </div>
    </div>
  );
}
