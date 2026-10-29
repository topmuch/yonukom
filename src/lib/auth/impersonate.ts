const IMPERSONATION_KEY = 'yonukom_impersonation';

interface ImpersonationInfo {
  tenantId: string;
  tenantName: string;
}

/**
 * Stores impersonation state in localStorage.
 */
export function createImpersonationSession(tenantId: string, tenantName: string): void {
  if (typeof window === 'undefined') return;

  const info: ImpersonationInfo = { tenantId, tenantName };
  localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(info));
}

/**
 * Checks if currently impersonating a tenant.
 */
export function isImpersonating(): boolean {
  if (typeof window === 'undefined') return false;

  return localStorage.getItem(IMPERSONATION_KEY) !== null;
}

/**
 * Returns the impersonation info or null if not impersonating.
 */
export function getImpersonationInfo(): ImpersonationInfo | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(IMPERSONATION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ImpersonationInfo;
  } catch {
    return null;
  }
}

/**
 * Clears impersonation state from localStorage.
 */
export function endImpersonation(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(IMPERSONATION_KEY);
}
