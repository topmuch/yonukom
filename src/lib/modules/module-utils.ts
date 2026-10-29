// ============================================================
// YonuKom — Fonctions utilitaires pour les modules (V3)
// Vérifier/activer/désactiver/verrouiller les modules d'un tenant.
// ============================================================

import { MODULES_CONFIG, MODULE_IDS, type ModuleId } from "./module-config";

export type ModulesJson = Record<string, { enabled: boolean; locked: boolean }>;

/**
 * Normalise le JSON des modules d'un tenant.
 * Si null/undefined → retourne un objet vide (les modules absents
 * sont considérés comme non-applicables/non-affichés).
 * Si incomplet → garde uniquement les modules qui existent dans MODULES_CONFIG.
 */
export function normalizeModules(raw: unknown): ModulesJson {
  if (!raw || typeof raw !== "object") return {};
  const parsed = raw as Record<string, unknown>;
  const result: ModulesJson = {};
  for (const key of MODULE_IDS) {
    const entry = parsed[key];
    if (entry && typeof entry === "object") {
      const e = entry as { enabled?: boolean; locked?: boolean };
      result[key] = {
        enabled: typeof e.enabled === "boolean" ? e.enabled : false,
        locked: typeof e.locked === "boolean" ? e.locked : false,
      };
    }
  }
  return result;
}

/**
 * Vérifie si un module est activé pour un tenant.
 * Si le module n'est pas dans le JSON → false (non-configuré).
 */
export function isModuleEnabled(modules: unknown, moduleId: ModuleId): boolean {
  const normalized = normalizeModules(modules);
  return normalized[moduleId]?.enabled === true;
}

/**
 * Vérifie si un module est verrouillé (le client ne peut pas le désactiver).
 */
export function isModuleLocked(modules: unknown, moduleId: ModuleId): boolean {
  const normalized = normalizeModules(modules);
  return normalized[moduleId]?.locked === true;
}

/**
 * Active/désactive un module.
 */
export function toggleModule(
  modules: unknown,
  moduleId: ModuleId,
  enabled: boolean
): ModulesJson {
  const normalized = normalizeModules(modules);
  return {
    ...normalized,
    [moduleId]: {
      ...normalized[moduleId],
      enabled,
    },
  };
}

/**
 * Verrouille/déverrouille un module (superadmin uniquement).
 */
export function lockModule(
  modules: unknown,
  moduleId: ModuleId,
  locked: boolean
): ModulesJson {
  const normalized = normalizeModules(modules);
  return {
    ...normalized,
    [moduleId]: {
      ...normalized[moduleId],
      locked,
    },
  };
}

/**
 * Retourne la liste des modules avec leur config + état (enabled/locked).
 * Utilisé pour afficher la grille de modules dans l'UI.
 */
export function getModulesWithState(modules: unknown) {
  const normalized = normalizeModules(modules);
  return MODULE_IDS.map((id) => ({
    ...MODULES_CONFIG[id],
    id: id as ModuleId,
    enabled: normalized[id]?.enabled ?? MODULES_CONFIG[id].defaultEnabled,
    locked: normalized[id]?.locked ?? false,
  }));
}
