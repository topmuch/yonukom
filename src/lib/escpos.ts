// ============================================================
// YonuKom — ESC/POS receipt encoder (58mm thermal printers)
// Produces a Uint8Array of ESC/POS commands from order data.
// Designed for cheap AliExpress 58mm Bluetooth Classic printers.
//
// Design choices for max compatibility:
//  - Accents folded (é→e, à→a, ç→c) via NFD normalize so the ticket
//    is readable on ANY printer regardless of code-page support.
//  - 32-char line width (font A, 58mm).
//  - QR via standard GS ( k sequence.
//  - No raster logo in v1 (text business name in double-size bold).
// ============================================================

/** Fold accents/diacritics to ASCII for printer-safe text. */
export function foldAccents(s: string): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // combining diacritics
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .replace(/€/g, "EUR")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, "-")
    .replace(/–/g, "-");
}

// --- ESC/POS command bytes ---
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// ESC/POS builder — minimal, controlled.
export class EscPosBuilder {
  private chunks: number[] = [];

  private raw(...bytes: number[]): this {
    for (const b of bytes) this.chunks.push(b);
    return this;
  }
  /** Bytes from a string (ASCII after fold). */
  text(s: string): this {
    const folded = foldAccents(s);
    for (let i = 0; i < folded.length; i++) {
      this.chunks.push(folded.charCodeAt(i) & 0xff);
    }
    return this;
  }
  /** Append raw byte array. */
  bytes(arr: Uint8Array | number[]): this {
    for (const b of arr) this.chunks.push(b);
    return this;
  }
  line(s = ""): this {
    return this.text(s).raw(LF);
  }
  lf(n = 1): this {
    for (let i = 0; i < n; i++) this.chunks.push(LF);
    return this;
  }
  init(): this {
    return this.raw(ESC, 0x40);
  }
  align(mode: "left" | "center" | "right"): this {
    const n = mode === "center" ? 1 : mode === "right" ? 2 : 0;
    return this.raw(ESC, 0x61, n);
  }
  bold(on: boolean): this {
    return this.raw(ESC, 0x45, on ? 1 : 0);
  }
  /** Set char width/height: 0 normal, 1 double. */
  size(w: 0 | 1, h: 0 | 1): this {
    return this.raw(GS, 0x21, ((h & 1) << 4) | (w & 1));
  }
  underline(on: boolean): this {
    return this.raw(ESC, 0x2d, on ? 1 : 0);
  }
  /** Dashed separator line filling the width. */
  separator(width = 32, ch = "-"): this {
    return this.line(ch.repeat(width));
  }
  /** Cut paper (feeds 3 lines then full cut). */
  cut(): this {
    return this.lf(3).raw(GS, 0x56, 0x00);
  }
  /** QR code (GS ( k standard sequence). */
  qr(data: string, moduleSize = 6): this {
    const dataBytes = Array.from(Buffer.from(data, "utf-8"));
    const len = dataBytes.length + 3; // pL + pH count includes cn+fn+n
    const pL = len & 0xff;
    const pH = (len >> 8) & 0xff;
    // Model: QR Model 2
    this.raw(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Module size
    this.raw(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize & 0xff);
    // Error correction level M
    this.raw(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);
    // Store data
    this.raw(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...dataBytes);
    // Print QR
    this.raw(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this;
  }

  encode(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }
}

/** Format a number as FCFA string (no decimals). */
export function formatFCFA(n: number | null | undefined): string {
  const v = typeof n === "number" && !isNaN(n) ? n : 0;
  return v.toLocaleString("fr-FR") + " FCFA";
}

/** Format a number as a compact string (no FCFA suffix) for item lines. */
export function formatNum(n: number | null | undefined): string {
  const v = typeof n === "number" && !isNaN(n) ? n : 0;
  return v.toLocaleString("fr-FR");
}

/** Pad a two-part line to a fixed width: `left` left-aligned, `right` right-aligned. */
export function padLine(left: string, right: string, width: 32): string {
  const leftFolded = foldAccents(left);
  const rightFolded = foldAccents(right);
  const maxLeft = width - rightFolded.length - 1;
  let l = leftFolded;
  if (l.length > maxLeft) l = l.slice(0, maxLeft - 1) + "~"; // truncate with marker
  const gap = Math.max(1, width - l.length - rightFolded.length);
  return l + " ".repeat(gap) + rightFolded;
}
