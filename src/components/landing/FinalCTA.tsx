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

// QR code pointing to the PWA install URL.
// Uses the public api.qrserver.com service which renders a real, scannable QR
// code on the fly. When scanned with any smartphone camera, it opens the
// YonuKom web app (which is a PWA — the browser will offer "Add to home
// screen" = install the app, no Play Store needed).
function QRCodeVisual() {
  // PWA URL = the live site root, where the manifest.json + service worker
  // are registered. Scanning this code opens the site on the user's phone,
  // and the browser prompts them to install the PWA.
  const pwaUrl = "https://yonukom.qrtags.pro/";

  // QR Server API: returns a PNG QR code at the requested size, with quiet zone
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&color=1E293B&bgcolor=FFFFFF&data=${encodeURIComponent(
    pwaUrl
  )}`;

  return (
    <a
      href={pwaUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Scanner ce QR code pour installer l'application YonuKom"
      className="block bg-white p-4 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt="QR code — scannez pour installer l'application YonuKom"
        width={180}
        height={180}
        loading="lazy"
        className="block"
      />
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <QrCode className="w-3.5 h-3.5 text-[#E91E63]" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
          Scannez pour installer
        </span>
      </div>
    </a>
  );
}

export function FinalCTA({ onSignup }: FinalCTAProps) {
  return (
    <section className="py-20 sm:py-24 lg:py-28 relative overflow-hidden bg-[#FFF1F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#E91E63] via-[#AD1457] to-[#1A5FAB] shadow-[0_32px_64px_-16px_rgba(51,139,226,0.5)]"
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
