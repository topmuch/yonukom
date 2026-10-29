// ============================================================
// YonuKom — Store Zustand : IA Locale
// Gère les alertes et recommandations de l'IA
// ============================================================

import { create } from "zustand";
import type { AIAlert, AIPriority } from "@/lib/ai/rules-engine";

export interface AIState {
  // --- ÉTAT ---
  /** Alertes/recommandations générées par l'IA */
  alerts: AIAlert[];
  /** Nombre d'alertes urgentes */
  urgentCount: number;
  /** L'IA est-elle en cours d'analyse ? */
  isAnalyzing: boolean;
  /** L'IA a-t-elle été initialisée ? */
  isInitialized: boolean;
  /** Dernière analyse */
  lastAnalysisAt: Date | null;
  /** Filtre de priorité actif */
  priorityFilter: AIPriority | "all";

  // --- ACTIONS ---
  /** Met à jour les alertes (appelé par le scheduler) */
  setAlerts: (alerts: AIAlert[]) => void;
  /** Marque l'analyse en cours */
  setAnalyzing: (isAnalyzing: boolean) => void;
  /** Change le filtre de priorité */
  setPriorityFilter: (filter: AIPriority | "all") => void;
  /** Supprime une alerte (l'utilisateur l'a traitée) */
  dismissAlert: (alertId: string) => void;
  /** Réinitialise toutes les alertes */
  clearAlerts: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  alerts: [],
  urgentCount: 0,
  isAnalyzing: false,
  isInitialized: false,
  lastAnalysisAt: null,
  priorityFilter: "all",

  setAlerts: (alerts) => {
    const urgentCount = alerts.filter((a) => a.priority === "urgent").length;
    set({ alerts, urgentCount, isAnalyzing: false, isInitialized: true, lastAnalysisAt: new Date() });
  },

  setAnalyzing: (isAnalyzing) => {
    set({ isAnalyzing });
  },

  setPriorityFilter: (priorityFilter) => {
    set({ priorityFilter });
  },

  dismissAlert: (alertId) => {
    const { alerts } = get();
    const updated = alerts.filter((a) => a.id !== alertId);
    const urgentCount = updated.filter((a) => a.priority === "urgent").length;
    set({ alerts: updated, urgentCount });
  },

  clearAlerts: () => {
    set({ alerts: [], urgentCount: 0 });
  },
}));
