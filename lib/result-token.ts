/**
 * Signed token utilities for the result page access control.
 *
 * Token format: {base64url(JSON)}.{hmac-sha256-hex}
 *
 * Works in both Node.js (API routes) and Edge Runtime (middleware)
 * because it uses the Web Crypto API (crypto.subtle), available in both.
 */

export interface ResultTokenData {
  date:  string
  city:  string
  email: string
  name1: string
  name2: string
}

interface TokenPayload extends ResultTokenData {
  exp: number
}

// ─── Base64url helpers (RFC 4648 §5) ─────────────────────────────────────────
// Standard btoa can produce '+', '/', and '=' which are percent-encoded inside
// Set-Cookie headers by Next.js, breaking HMAC verification on readback.
// Base64url uses '-' and '_' instead, and omits padding — fully cookie-safe.

function toBase64Url(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

function fromBase64Url(str: string): string {
  // Re-add padding so atob can decode it
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4)
  return atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
}

// ─────────────────────────────────────────────────────────────────────────────

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(data))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

async function hmacVerify(secret: string, data: string, expected: string): Promise<boolean> {
  const actual = await hmacSign(secret, data)
  // constant-time comparison via XOR to avoid timing attacks
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

// ─────────────────────────────────────────────────────────────────────────────

export async function createResultToken(data: ResultTokenData): Promise<string> {
  const secret = process.env.RESULT_SECRET
  if (!secret) throw new Error("RESULT_SECRET env var is required")
  const payload: TokenPayload = { ...data, exp: Date.now() + 3600_000 }
  const encoded = toBase64Url(JSON.stringify(payload))
  const sig     = await hmacSign(secret, encoded)
  return `${encoded}.${sig}`
}

export async function verifyResultToken(token: string): Promise<ResultTokenData | null> {
  try {
    const dotIdx = token.lastIndexOf(".")
    if (dotIdx === -1) return null

    const encoded = token.slice(0, dotIdx)
    const sig     = token.slice(dotIdx + 1)
    if (!encoded || !sig) return null

    const secret = process.env.RESULT_SECRET
    if (!secret) return null

    const valid = await hmacVerify(secret, encoded, sig)
    if (!valid) return null

    const { exp, ...data } = JSON.parse(fromBase64Url(encoded)) as TokenPayload
    if (Date.now() > exp) return null

    return data
  } catch {
    return null
  }
}
