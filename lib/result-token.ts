/**
 * Signed token utilities for the result page access control.
 *
 * Token format: {base64(JSON)}.{hmac-sha256-hex}
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

// Fallback for local dev — override with RESULT_SECRET env var in production.
const FALLBACK_SECRET = "starry-sky-dev-secret-change-in-prod"

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
  const secret  = process.env.RESULT_SECRET ?? FALLBACK_SECRET
  const payload = toBase64Url(JSON.stringify(data))
  const sig     = await hmacSign(secret, payload)
  return `${payload}.${sig}`
}

export async function verifyResultToken(token: string): Promise<ResultTokenData | null> {
  try {
    const dotIdx = token.lastIndexOf(".")
    if (dotIdx === -1) return null

    const payload = token.slice(0, dotIdx)
    const sig     = token.slice(dotIdx + 1)
    if (!payload || !sig) return null

    const secret = process.env.RESULT_SECRET ?? FALLBACK_SECRET
    const valid  = await hmacVerify(secret, payload, sig)
    if (!valid) return null

    return JSON.parse(fromBase64Url(payload)) as ResultTokenData
  } catch {
    return null
  }
}
