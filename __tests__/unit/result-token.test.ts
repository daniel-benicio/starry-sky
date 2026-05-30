import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createResultToken, verifyResultToken } from "@/lib/result-token"
import type { ResultTokenData } from "@/lib/result-token"

const SAMPLE: ResultTokenData = {
  date:  "2024-02-14",
  city:  "São Paulo",
  email: "ana@email.com",
  name1: "Ana",
  name2: "Lucas",
}

let savedSecret: string | undefined
beforeEach(() => {
  savedSecret = process.env.RESULT_SECRET
  process.env.RESULT_SECRET ??= "test-secret"
})
afterEach(() => {
  if (savedSecret === undefined) delete process.env.RESULT_SECRET
  else process.env.RESULT_SECRET = savedSecret
})

// ─── createResultToken ────────────────────────────────────────────────────────

describe("createResultToken", () => {
  it("retorna uma string no formato {payload}.{signature}", async () => {
    const token = await createResultToken(SAMPLE)
    const parts = token.split(".")
    // O payload é base64 (sem pontos), a assinatura é hex (sem pontos)
    expect(parts).toHaveLength(2)
    expect(parts[0].length).toBeGreaterThan(0)
    expect(parts[1].length).toBeGreaterThan(0)
  })

  it("o payload decodifica para os dados originais", async () => {
    const token   = await createResultToken(SAMPLE)
    const payload = token.split(".")[0]
    const decoded = JSON.parse(atob(payload))
    expect(decoded).toMatchObject(SAMPLE)
  })

  it("lança erro quando RESULT_SECRET não está configurado", async () => {
    delete process.env.RESULT_SECRET
    await expect(createResultToken(SAMPLE)).rejects.toThrow("RESULT_SECRET env var is required")
  })

  it("a assinatura muda quando o secret muda — mesmos dados, chaves diferentes", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"))
    try {
      process.env.RESULT_SECRET = "secret-A"
      const tokenA = await createResultToken(SAMPLE)

      process.env.RESULT_SECRET = "secret-B"
      const tokenB = await createResultToken(SAMPLE)

      // Payloads idênticos (mesmo timestamp fixado), assinaturas distintas
      expect(tokenA.split(".")[0]).toBe(tokenB.split(".")[0])
      expect(tokenA.split(".")[1]).not.toBe(tokenB.split(".")[1])
    } finally {
      vi.useRealTimers()
    }
  })

  it("tokens diferentes para dados diferentes", async () => {
    const tokenA = await createResultToken(SAMPLE)
    const tokenB = await createResultToken({ ...SAMPLE, name1: "Pedro" })
    expect(tokenA).not.toBe(tokenB)
  })
})

// ─── verifyResultToken ────────────────────────────────────────────────────────

describe("verifyResultToken", () => {
  it("round-trip: retorna os dados originais para token válido", async () => {
    const token = await createResultToken(SAMPLE)
    const data  = await verifyResultToken(token)
    expect(data).not.toBeNull()
    expect(data?.date).toBe(SAMPLE.date)
    expect(data?.city).toBe(SAMPLE.city)
    expect(data?.email).toBe(SAMPLE.email)
    expect(data?.name1).toBe(SAMPLE.name1)
    expect(data?.name2).toBe(SAMPLE.name2)
  })

  it("retorna null para string vazia", async () => {
    expect(await verifyResultToken("")).toBeNull()
  })

  it("retorna null quando falta o separador de ponto", async () => {
    expect(await verifyResultToken("sempontoalgum")).toBeNull()
  })

  it("retorna null quando a assinatura foi adulterada", async () => {
    const token   = await createResultToken(SAMPLE)
    const payload = token.split(".")[0]
    const tampered = `${payload}.${"0".repeat(64)}`
    expect(await verifyResultToken(tampered)).toBeNull()
  })

  it("retorna null quando o payload foi adulterado (mas assinatura original mantida)", async () => {
    const token      = await createResultToken(SAMPLE)
    const [, sig]    = token.split(".")
    const fakePayload = btoa(JSON.stringify({ ...SAMPLE, name1: "Hacker" }))
    expect(await verifyResultToken(`${fakePayload}.${sig}`)).toBeNull()
  })

  it("retorna null quando verificado com secret diferente do usado na criação", async () => {
    process.env.RESULT_SECRET = "secret-criacao"
    const token = await createResultToken(SAMPLE)

    process.env.RESULT_SECRET = "secret-verificacao"
    expect(await verifyResultToken(token)).toBeNull()
  })

  it("retorna null para token com payload que não é JSON válido", async () => {
    // payload = base64 de texto não-JSON
    const badPayload = btoa("isso não é json {{{")
    const fakeToken  = `${badPayload}.fakesig`
    expect(await verifyResultToken(fakeToken)).toBeNull()
  })

  it("retorna null quando RESULT_SECRET não está configurado", async () => {
    const token = await createResultToken(SAMPLE)
    delete process.env.RESULT_SECRET
    expect(await verifyResultToken(token)).toBeNull()
  })

  it("retorna null para token expirado", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"))
    try {
      const token = await createResultToken(SAMPLE)
      vi.advanceTimersByTime(3_600_001)
      expect(await verifyResultToken(token)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
