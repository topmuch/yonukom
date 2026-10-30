"use client";

import { LegalPageLayout } from "@/components/landing/LegalPageLayout";
import { FileText } from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  subsections?: {
    title: string;
    paragraphs: string[];
  }[];
  list?: string[];
}

interface LegalContentProps {
  badge: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalContent({
  badge,
  title,
  intro,
  lastUpdated,
  sections,
}: LegalContentProps) {
  return (
    <LegalPageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#F6F9FE] via-white to-[#EBF2FE] pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#338BE2]/10 text-[#338BE2] text-xs font-semibold uppercase tracking-wide mb-4">
            <FileText className="w-3.5 h-3.5" />
            {badge}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            {title}
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-3">
            {intro}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
            Dernière mise à jour : {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {sections.map((section, idx) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-24"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-start gap-3">
                  <span className="text-[#338BE2] text-sm font-mono mt-1.5 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{section.title}</span>
                </h2>

                {section.paragraphs?.map((p, i) => (
                  <p
                    key={i}
                    className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3"
                  >
                    {p}
                  </p>
                ))}

                {section.list && (
                  <ul className="space-y-2 mb-3">
                    {section.list.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-slate-600 text-sm sm:text-base leading-relaxed"
                      >
                        <span className="text-[#338BE2] mt-1 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.subsections?.map((sub, i) => (
                  <div key={i} className="mt-5 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                      {sub.title}
                    </h3>
                    {sub.paragraphs.map((p, j) => (
                      <p
                        key={j}
                        className="text-slate-600 text-sm sm:text-base leading-relaxed mb-2"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </article>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <p className="text-sm text-slate-500 leading-relaxed">
              Pour toute question relative à ce document, vous pouvez nous
              contacter à{" "}
              <a
                href="mailto:contact@2mails.com"
                className="text-[#338BE2] hover:underline font-medium"
              >
                contact@2mails.com
              </a>{" "}
              ou au{" "}
              <a
                href="tel:+221783821822"
                className="text-[#338BE2] hover:underline font-medium"
              >
                78 382 18 22
              </a>
              . Notre équipe est basée à 2m Sicap Foire, Dakar, Sénégal.
            </p>
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
