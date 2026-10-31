"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { Users, ThumbsUp, Star } from "lucide-react";

interface Stat {
  icon: React.ElementType;
  value: number;
  suffix: string;
  decimals?: number;
  label: string;
  color: string;
}

const stats: Stat[] = [
  {
    icon: Users,
    value: 7.8,
    suffix: "K",
    decimals: 1,
    label: "Utilisateurs actifs",
    color: "#E91E63",
  },
  {
    icon: ThumbsUp,
    value: 76,
    suffix: "%",
    label: "Taux de satisfaction",
    color: "#10B981",
  },
  {
    icon: Star,
    value: 4.93,
    suffix: "/5",
    decimals: 2,
    label: "Note moyenne",
    color: "#F59E0B",
  },
];

function AnimatedNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: 2000,
    bounce: 0,
  });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (v) => {
      setDisplay(v.toFixed(decimals));
    });
    return () => unsubscribe();
  }, [springValue, decimals]);

  return <span ref={ref}>{display}</span>;
}

export function Statistics() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(51,139,226,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
                    style={{ color: stat.color }}
                  >
                    <AnimatedNumber
                      value={stat.value}
                      decimals={stat.decimals ?? 0}
                    />
                  </span>
                  <span
                    className="text-2xl sm:text-3xl lg:text-4xl font-extrabold"
                    style={{ color: stat.color }}
                  >
                    {stat.suffix}
                  </span>
                </div>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-500">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
