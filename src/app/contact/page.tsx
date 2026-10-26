"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <LegalPageLayout>
      <div className="bg-[#F6F9FE] pt-16 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#338BE2]/10 text-[#338BE2] text-xs font-semibold uppercase tracking-wide mb-4">
              Contact
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Contactez-nous
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Une question, une demande de démo ou un besoin spécifique ? Notre
              équipe basée à Dakar vous répond sous 24h ouvrées.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact info + map */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#338BE2]/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#338BE2]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Adresse
                    </p>
                    <p className="text-slate-800 font-medium mt-0.5">
                      2m Sicap Foire, Dakar
                    </p>
                    <p className="text-sm text-slate-500">Sénégal</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Téléphone
                    </p>
                    <a
                      href="tel:+221783821822"
                      className="text-slate-800 font-medium mt-0.5 hover:text-[#338BE2] transition-colors"
                    >
                      78 382 18 22
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Email
                    </p>
                    <a
                      href="mailto:contact@2mails.com"
                      className="text-slate-800 font-medium mt-0.5 hover:text-[#338BE2] transition-colors"
                    >
                      contact@2mails.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      WhatsApp
                    </p>
                    <a
                      href="https://wa.me/221783821822"
                      target="_blank"
                      rel="noopener"
                      className="text-slate-800 font-medium mt-0.5 hover:text-[#25D366] transition-colors"
                    >
                      78 382 18 22
                    </a>
                  </div>
                </div>
              </div>

              {/* Google Map */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <iframe
                  src="https://maps.google.com/maps?q=2m+Sicap+Foire,+Dakar,+Senegal&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="320"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Carte YonuKom Sicap Foire Dakar"
                />
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                Envoyez-nous un message
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Remplissez ce formulaire et nous vous répondrons par email sous
                24h.
              </p>
              {sent && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2">
                  <Send className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Votre message a été envoyé ! Nous vous répondrons sous 24h.
                  </span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Votre nom"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="vous@exemple.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="Votre message..."
                    required
                    rows={5}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#338BE2] hover:bg-[#2074C6] text-white gap-2"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </LegalPageLayout>
  );
}
