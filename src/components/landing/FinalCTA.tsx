"use client";

import { motion } from "framer-motion";
import {
  Download,
  Smartphone,
  CheckCircle2,
  QrCode,
  Star,
  Apple,
} from "lucide-react";

interface FinalCTAProps {
  onSignup?: () => void;
}

// QR code visual — stylized pixel grid resembling a QR code
function QRCodeVisual() {
  // 21x21 grid pattern (typical QR code size)
  const size = 21;
  // Deterministic pattern based on position
  const isFilled = (r: number, c: number) => {
    // Corner finder patterns (7x7) — top-left, top-right, bottom-left
    const isFinder = (or: number, oc: number) => {
      const dr = r - or;
      const dc = c - oc;
      if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return null;
      // outer ring + inner 3x3
      if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
      if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
      return false;
    };
    const tl = isFinder(0, 0);
    if (tl !== null) return tl;
    const tr = isFinder(0, size - 7);
    if (tr !== null) return tr;
    const bl = isFinder(size - 7, 0);
    if (bl !== null) return bl;
    // Alignment pattern (bottom-right) — 5x5
    const ar = r - (size - 9);
    const ac = c - (size - 9);
    if (ar >= 0 && ar <= 4 && ac >= 0 && ac <= 4) {
      if (ar === 0 || ar === 4 || ac === 0 || ac === 4) return true;
      if (ar === 2 && ac === 2) return true;
      return false;
    }
    // Timing patterns
    if (r === 6 || c === 6) return (r + c) % 2 === 0;
    // Pseudo-random data
    return (r * 7 + c * 11 + (r ^ c)) % 3 === 0;
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          width: "180px",
          height: "180px",
        }}
      >
        {Array.from({ length: size * size }).map((_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const filled = isFilled(r, c);
          return (
            <div
              key={i}
              className={filled ? "bg-slate-900" : "bg-white"}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <QrCode className="w-3.5 h-3.5 text-[#338BE2]" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
          Scannez pour télécharger
        </span>
      </div>
    </div>
  );
}

export function FinalCTA({ onSignup }: FinalCTAProps) {
  return (
    <section className="py-20 sm:py-24 lg:py-28 relative overflow-hidden bg-[#F6F9FE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#338BE2] via-[#2074C6] to-[#1A5FAB] shadow-[0_32px_64px_-16px_rgba(51,139,226,0.5)]"
        >
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(183,190,218,0.6) 0%, transparent 70%)",
            }}
          />

          <div className="relative px-6 sm:px-12 lg:px-16 py-12 sm:py-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              {/* LEFT: Text */}
              <div className="text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 mb-6"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Application mobile
                  </span>
                </motion.div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
                  Téléchargez YonuKom
                </h2>

                <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Emportez votre commerce partout. Encaissez, suivez vos ventes
                  et gérez votre stock depuis votre smartphone, même hors ligne.
                </p>

                {/* Store buttons */}
                <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <button
                    type="button"
                    onClick={onSignup}
                    className="inline-flex items-center gap-3 px-5 h-14 rounded-xl bg-white text-slate-900 hover:bg-white/95 transition-all shadow-lg"
                  >
                    <Apple className="w-7 h-7 text-slate-900" />
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 leading-none">
                        Télécharger sur
                      </p>
                      <p className="text-base font-bold leading-tight">
                        App Store
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={onSignup}
                    className="inline-flex items-center gap-3 px-5 h-14 rounded-xl bg-white text-slate-900 hover:bg-white/95 transition-all shadow-lg"
                  >
                    <Smartphone className="w-7 h-7 text-slate-900" />
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 leading-none">
                        Disponible sur
                      </p>
                      <p className="text-base font-bold leading-tight">
                        Google Play
                      </p>
                    </div>
                  </button>
                </div>

                {/* Trust indicators */}
                <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-white/70">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    Application gratuite
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    4.9/5 — 8 200 avis
                  </span>
                </div>
              </div>

              {/* RIGHT: QR code */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center lg:justify-end"
              >
                <div className="relative">
                  <QRCodeVisual />
                  {/* Floating download badge */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-2.5 border border-slate-100"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-900 leading-none">
                          App gratuite
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          iOS & Android
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
