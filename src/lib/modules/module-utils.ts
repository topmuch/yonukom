// ============================================================
// YonuKom — Fonctions utilitaires pour les modules
// Vérifier/activer/désactiver/verrouiller les modules d'un tenant.
// ============================================================

import { MODULES_CONFIG, buildDefaultModules, type ModuleId } from "./module-config";

export type ModulesJson = Record<string, { enabled: boolean; locked: boolean }>;

/**
 * Normalise le JSON des modules d'un tenant.
 * Si null/undefined → retourne les valeurs par défaut (buildDefaultModules).
 * Si incomplet → complète avec les valeurs par défaut pour les modules manquants.
 */
export function normalizeModules(raw: unknown): ModulesJson {
  const defaults = buildDefaultModules();
  if (!raw || typeof raw !== "object") return defaults;
  const parsed = raw as Record<string, unknown>;
  const result: ModulesJson = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const entry = parsed[key];
    if (entry && typeof entry === "object") {
      const e = entry as { enabled?: boolean; locked?: boolean };
      result[key] = {
        enabled: typeof e.enabled === "boolean" ? e.enabled : defaults[key as ModuleId].enabled,
        locked: typeof e.locked === "boolean" ? e.locked : false,
      };
    }
  }
  return result;
}

/**
 * Vérifie si un module est activé pour un tenant.
 * Si le module n'est pas dans le JSON, utilise defaultEnabled de MODULES_CONFIG.
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
 * Ne modifie PAS le flag locked (utilisé par le client qui ne peut que toggler enabled).
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
 * Un module verrouillé ne peut pas être désactivé par le client.
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
  return Object.entries(MODULES_CONFIG).map(([id, config]) => ({
    ...config,
    id: id as ModuleId,
    enabled: normalized[id]?.enabled ?? config.defaultEnabled,
    locked: normalized[id]?.locked ?? false,
  }));
}
