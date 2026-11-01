"use client";

// ============================================================
// YonuKom — Bluetooth print bridge client
// Talks to the local "YonuKom Print Bridge" Android app which runs
// an HTTP server on the phone at http://localhost:47822 and forwards
// ESC/POS bytes to the paired Bluetooth Classic thermal printer.
//
// Flow:
//   1. isBridgeAvailable() → GET /health (1.5s timeout)
//   2. printOrderBluetooth(orderId):
//        - fetch ESC/POS bytes from /api/orders/:id/escpos (same origin)
//        - POST bytes to http://localhost:47822/print (CORS)
//        - returns { ok, error? }
//
// When the bridge is not installed, calls return a clear "not available"
// result so the UI can prompt the user to install the bridge APK — the
// sale flow is never blocked.
// ============================================================

/** Default port the bridge Android app listens on. */
export const DEFAULT_BRIDGE_PORT = 47822;

/** Allow override from localStorage for advanced users / debugging. */
function getBridgeBase(): string {
  if (typeof window === "undefined") return `http://localhost:${DEFAULT_BRIDGE_PORT}`;
  try {
    const custom = window.localStorage.getItem("yonukom_bridge_url");
    if (custom) return custom.replace(/\/$/, "");
  } catch {
    /* ignore */
  }
  return `http://localhost:${DEFAULT_BRIDGE_PORT}`;
}

export interface BridgeStatus {
  available: boolean;
  printer?: {
    name?: string;
    address?: string;
    connected?: boolean;
  };
  version?: string;
  error?: string;
}

/** Quick liveness check — short timeout so the UI never hangs. */
export async function isBridgeAvailable(timeoutMs = 1500): Promise<BridgeStatus> {
  const base = getBridgeBase();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/health`, {
      method: "GET",
      mode: "cors",
      signal: controller.signal,
    });
    if (!res.ok) return { available: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return {
      available: true,
      printer: data.printer,
      version: data.version,
    };
  } catch (e) {
    return {
      available: false,
      error: e instanceof Error ? e.message : "fetch failed",
    };
  } finally {
    clearTimeout(t);
  }
}

export interface PrintResult {
  ok: boolean;
  error?: string;
}

/**
 * Fetch the ESC/POS bytes for an order (same-origin) and forward them
 * to the bridge for Bluetooth printing.
 */
export async function printOrderBluetooth(orderId: string): Promise<PrintResult> {
  const base = getBridgeBase();

  // 1. Fetch ESC/POS bytes from our own API
  let bytesBuffer: ArrayBuffer;
  try {
    const escposRes = await fetch(`/api/orders/${orderId}/escpos`, {
      method: "GET",
      cache: "no-store",
    });
    if (!escposRes.ok) {
      return { ok: false, error: `Ticket introuvable (HTTP ${escposRes.status})` };
    }
    bytesBuffer = await escposRes.arrayBuffer();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "erreur de chargement du ticket",
    };
  }

  // 2. POST bytes to the bridge
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000); // print can take a few seconds
  try {
    const res = await fetch(`${base}/print`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/octet-stream" },
      body: bytesBuffer,
      signal: controller.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `Pont: HTTP ${res.status} ${txt}`.trim() };
    }
    const data = await res.json().catch(() => ({}));
    if (data.ok === false) {
      return { ok: false, error: data.error || "impression échouée" };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erreur réseau vers le pont";
    if (/abort|timeout/i.test(msg)) {
      return { ok: false, error: "Pont injoignable — l'app pont est-elle lancée ?" };
    }
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}

/** List paired Bluetooth printers known to the bridge. */
export async function listBridgePrinters(): Promise<
  { address: string; name: string }[] | null
> {
  const base = getBridgeBase();
  try {
    const res = await fetch(`${base}/printers`, { mode: "cors" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.printers) ? data.printers : null;
  } catch {
    return null;
  }
}

/** Ask the bridge to connect to a specific paired printer. */
export async function connectBridgePrinter(address: string): Promise<PrintResult> {
  const base = getBridgeBase();
  try {
    const res = await fetch(`${base}/connect`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: data.ok !== false, error: data.error };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erreur" };
  }
}
