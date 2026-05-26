import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/checkout/route"

vi.mock("@/lib/pagarme", () => ({
  createOrder: vi.fn(),
}))

import { createOrder } from "@/lib/pagarme"

const validBody = {
  cardToken: "tok_test_123",
  email: "ana@email.com",
  date: "2024-02-14",
  city: "São Paulo",
  name1: "Ana",
  name2: "Lucas",
}

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PAGARME_SECRET_KEY = "sk_test_secret"
  })

  it("retorna 200 com orderId em caso de sucesso", async () => {
    vi.mocked(createOrder).mockResolvedValueOnce({ id: "order_abc123" })

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.orderId).toBe("order_abc123")
  })

  it("retorna 400 quando cardToken está ausente", async () => {
    const { cardToken: _, ...sem } = validBody
    const res = await POST(makeRequest(sem))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe("Dados incompletos.")
  })

  it("retorna 400 quando email está ausente", async () => {
    const { email: _, ...sem } = validBody
    const res = await POST(makeRequest(sem))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe("Dados incompletos.")
  })

  it("retorna 500 quando PAGARME_SECRET_KEY não está configurada", async () => {
    delete process.env.PAGARME_SECRET_KEY

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.message).toBe("Configuração de pagamento inválida.")
  })

  it("retorna 400 quando Pagarme lança erro de cartão recusado", async () => {
    vi.mocked(createOrder).mockRejectedValueOnce(new Error("cartão recusado"))

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toMatch(/recusado/i)
  })

  it("retorna 400 quando Pagarme lança erro de token inválido", async () => {
    vi.mocked(createOrder).mockRejectedValueOnce(new Error("token inválido"))

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(400)
  })

  it("retorna 500 para erros genéricos do Pagarme", async () => {
    vi.mocked(createOrder).mockRejectedValueOnce(new Error("timeout de rede"))

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.message).toBe("timeout de rede")
  })

  it("passa os dados corretos para createOrder", async () => {
    vi.mocked(createOrder).mockResolvedValueOnce({ id: "order_xyz" })

    await POST(makeRequest(validBody))

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ana@email.com",
        cardToken: "tok_test_123",
      }),
      "sk_test_secret"
    )
  })
})
