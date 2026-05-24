import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/generate-result/route"
import { verifyResultToken } from "@/lib/result-token"

// ── Mock do Nominatim ─────────────────────────────────────────────────────────
// Evita chamadas de rede reais nos testes; o comportamento do fallback
// (geocoding estático) é testado separadamente nos testes de unidade.
//
// vi.mock é hoisted antes das variáveis — usamos vi.hoisted para definir
// o mock fn antes do hoist e reutilizá-lo nos testes.

const { mockNominatim, NOMINATIM_COORDS } = vi.hoisted(() => {
  const NOMINATIM_COORDS = { lat: -23.5505, lon: -46.6333, displayName: "São Paulo" }
  const mockNominatim    = vi.fn().mockResolvedValue(NOMINATIM_COORDS)
  return { mockNominatim, NOMINATIM_COORDS }
})

vi.mock("@/lib/nominatim", () => ({
  nominatimGeocode: mockNominatim,
}))

// ─────────────────────────────────────────────────────────────────────────────

const VALID_BODY = {
  date:  "2024-02-14",
  city:  "São Paulo",
  email: "ana@email.com",
  name1: "Ana",
  name2: "Lucas",
}

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/generate-result", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

/** Extrai o valor do cookie result_token do header Set-Cookie. */
function extractToken(res: Response): string | null {
  const header = res.headers.get("set-cookie") ?? ""
  const match  = header.match(/result_token=([^;]+)/)
  return match ? match[1] : null
}

describe("POST /api/generate-result", () => {
  beforeEach(() => {
    delete process.env.RESULT_SECRET
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── resposta JSON ──────────────────────────────────────────────────────────

  it("retorna 200 com { success: true } para dados completos", async () => {
    const res  = await POST(makeRequest(VALID_BODY))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it("retorna 400 quando date está ausente", async () => {
    const { date: _, ...sem } = VALID_BODY
    const res = await POST(makeRequest(sem))
    expect(res.status).toBe(400)
    expect((await res.json()).message).toBe("Dados incompletos.")
  })

  it("retorna 400 quando name1 está ausente", async () => {
    const { name1: _, ...sem } = VALID_BODY
    const res = await POST(makeRequest(sem))
    expect(res.status).toBe(400)
    expect((await res.json()).message).toBe("Dados incompletos.")
  })

  it("retorna 400 quando name2 está ausente", async () => {
    const { name2: _, ...sem } = VALID_BODY
    const res = await POST(makeRequest(sem))
    expect(res.status).toBe(400)
    expect((await res.json()).message).toBe("Dados incompletos.")
  })

  it("aceita body sem city e email (campos opcionais)", async () => {
    const { city: _c, email: _e, ...semOpcionais } = VALID_BODY
    const res = await POST(makeRequest(semOpcionais))
    expect(res.status).toBe(200)
  })

  // ── cookie ─────────────────────────────────────────────────────────────────

  it("seta o cookie result_token no header Set-Cookie", async () => {
    const res    = await POST(makeRequest(VALID_BODY))
    const cookie = res.headers.get("set-cookie")
    expect(cookie).toMatch(/result_token=/)
  })

  it("o cookie tem o atributo HttpOnly", async () => {
    const res    = await POST(makeRequest(VALID_BODY))
    const cookie = res.headers.get("set-cookie") ?? ""
    expect(cookie.toLowerCase()).toContain("httponly")
  })

  it("o cookie é restrito ao path /result", async () => {
    const res    = await POST(makeRequest(VALID_BODY))
    const cookie = res.headers.get("set-cookie") ?? ""
    expect(cookie.toLowerCase()).toContain("path=/result")
  })

  it("o cookie expira em até 1 hora (Max-Age ≤ 3600)", async () => {
    const res    = await POST(makeRequest(VALID_BODY))
    const cookie = res.headers.get("set-cookie") ?? ""
    const match  = cookie.toLowerCase().match(/max-age=(\d+)/)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeLessThanOrEqual(3600)
    expect(Number(match![1])).toBeGreaterThan(0)
  })

  // ── integridade do token ───────────────────────────────────────────────────

  it("o token no cookie é verificável e contém os dados do pedido", async () => {
    const res   = await POST(makeRequest(VALID_BODY))
    const token = extractToken(res)
    expect(token).not.toBeNull()

    const data = await verifyResultToken(token!)
    expect(data).not.toBeNull()
    expect(data?.date).toBe(VALID_BODY.date)
    expect(data?.city).toBe(VALID_BODY.city)
    expect(data?.email).toBe(VALID_BODY.email)
    expect(data?.name1).toBe(VALID_BODY.name1)
    expect(data?.name2).toBe(VALID_BODY.name2)
  })

  it("o token contém lat e lon quando Nominatim resolve a cidade", async () => {
    const res  = await POST(makeRequest(VALID_BODY))
    const data = await verifyResultToken(extractToken(res)!)
    expect(data?.lat).toBeCloseTo(NOMINATIM_COORDS.lat)
    expect(data?.lon).toBeCloseTo(NOMINATIM_COORDS.lon)
  })

  it("o token não tem lat/lon quando city está vazia", async () => {
    const { city: _c, email: _e, ...semCity } = VALID_BODY
    const res  = await POST(makeRequest(semCity))
    const data = await verifyResultToken(extractToken(res)!)
    expect(data?.lat).toBeUndefined()
    expect(data?.lon).toBeUndefined()
  })

  it("o token ainda é válido quando Nominatim falha (usa fallback estático)", async () => {
    mockNominatim.mockResolvedValueOnce(null)

    const res  = await POST(makeRequest(VALID_BODY))
    const data = await verifyResultToken(extractToken(res)!)
    // geocodeCity("São Paulo") resolve via tabela estática
    expect(data).not.toBeNull()
    expect(data?.lat).toBeCloseTo(-23.5505)
  })

  it("o token ainda é válido quando Nominatim e fallback estático falham", async () => {
    mockNominatim.mockResolvedValueOnce(null)

    const res  = await POST(makeRequest({ ...VALID_BODY, city: "CidadeInexistenteXYZ" }))
    const data = await verifyResultToken(extractToken(res)!)
    // Token gerado sem coords — não quebra o fluxo
    expect(res.status).toBe(200)
    expect(data).not.toBeNull()
    expect(data?.lat).toBeUndefined()
    expect(data?.lon).toBeUndefined()
  })

  it("tokens gerados para pedidos distintos são diferentes", async () => {
    const resA = await POST(makeRequest(VALID_BODY))
    const resB = await POST(makeRequest({ ...VALID_BODY, name1: "Pedro" }))
    expect(extractToken(resA)).not.toBe(extractToken(resB))
  })
})
