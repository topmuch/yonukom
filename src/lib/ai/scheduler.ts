// ============================================================
// YonuKom — IA Locale : Planificateur de Tâches
// Exécute les règles d'analyse périodiquement
// et met à jour le store Zustand avec les alertes.
//
// ⚠️ Fonctionne même HORS LIGNE.
// Utilise les données IndexedDB (pas le backend).
// ============================================================

import { generateRecommendations, type AIAlert, type AIAllData } from "@/lib/ai/rules-engine";
import { getLocalDataForAI, getMockDataForAI, syncHistoricalData } from "@/lib/db/historical-data";

/** Intervalle entre deux analyses (1 heure) */
const ANALYSIS_INTERVAL_MS = 60 * 60 * 1000;

/** Intervalle entre deux sync (30 minutes) */
const SYNC_INTERVAL_MS = 30 * 60 * 1000;

let analysisTimerId: ReturnType<typeof setInterval> | null = null;
let syncTimerId: ReturnType<typeof setInterval> | null = null;

// ==========================================
// ANALYSE IA
// ==========================================

/**
 * Exécute une analyse IA complète :
 * 1. Récupère les données locales (IndexedDB)
 * 2. Si pas de données → utilise les données mock
 * 3. Lance le moteur de règles
 * 4. Retourne les alertes générées
 */
export async function runAIAnalysis(): Promise<AIAlert[]> {
  console.log("[IA] 🔍 Analyse en cours...");

  try {
    // Tenter de récupérer les données locales
    let data = await getLocalDataForAI();

    // Si pas assez de données locales → utiliser mock pour démo
    if (data.products.length === 0 && data.sales.length === 0) {
      console.log("[IA] Pas de données locales — utilisation des données mock");
      data = getMockDataForAI();
    }

    // Lancer le moteur de règles
    const alerts = generateRecommendations(data);

    console.log(`[IA] ✅ Analyse terminée : ${alerts.length} alertes générées`);
    console.log(`[IA]   - ${alerts.filter((a) => a.priority === "urgent").length} urgentes`);
    console.log(`[IA]   - ${alerts.filter((a) => a.priority === "suggestion").length} suggestions`);
    console.log(`[IA]   - ${alerts.filter((a) => a.priority === "positive").length} positives`);

    return alerts;
  } catch (error) {
    console.error("[IA] ❌ Erreur analyse:", error);
    return [];
  }
}

// ==========================================
// SYNC + SCHEDULER
// ==========================================

/**
 * Démarre le scheduler IA :
 * - Sync les données du backend → IndexedDB toutes les 30 min
 * - Lance l'analyse IA toutes les heures
 * - Callback `onAlertsUpdate` appelé avec les nouvelles alertes
 */
export function startAIScheduler(
  onAlertsUpdate: (alerts: AIAlert[]) => void
): void {
  // Éviter les doublons
  stopAIScheduler();

  console.log("[IA] 🚀 Scheduler démarré");

  // Première analyse immédiate
  runAIAnalysis().then(onAlertsUpdate);

  // Sync périodique (30 min)
  syncTimerId = setInterval(async () => {
    try {
      await syncHistoricalData();
    } catch {
      // Sync silencieux — ne pas bloquer l'analyse
    }
  }, SYNC_INTERVAL_MS);

  // Analyse périodique (1h)
  analysisTimerId = setInterval(async () => {
    const alerts = await runAIAnalysis();
    onAlertsUpdate(alerts);
  }, ANALYSIS_INTERVAL_MS);
}

/** Arrête le scheduler IA */
export function stopAIScheduler(): void {
  if (analysisTimerId) {
    clearInterval(analysisTimerId);
    analysisTimerId = null;
  }
  if (syncTimerId) {
    clearInterval(syncTimerId);
    syncTimerId = null;
  }
  console.log("[IA] ⏹️ Scheduler arrêté");
}

// ==========================================
// SYNC INITIAL
// ==========================================

/**
 * Sync initial des données + première analyse.
 * Appelé au chargement de l'app.
 */
export async function initializeAI(businessId: string = "demo"): Promise<AIAlert[]> {
  // Sync les données du backend vers IndexedDB
  await syncHistoricalData(businessId);

  // Première analyse
  return runAIAnalysis();
}
