"use client";

import { motion } from "framer-motion";

interface GradientDividerProps {
  from?: string;
  to?: string;
}

export function GradientDivider({ from = "from-white", to = "to-yk-surface" }: GradientDividerProps) {
  return (
    <div className={`h-px bg-gradient-to-r ${from} ${to} ${from} mx-auto max-w-5xl opacity-50`} />
  );
}

export function SectionDivider() {
  return (
    <div className="relative py-0">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-yk-deep/[0.02] to-transparent pointer-events-none" />
    </div>
  );
}
