import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/checkout/route"

// Mock de todas as funções do módulo Supabase DB
vi.mock("@/lib/supabase/db", () => ({
  upsertUser:        vi.fn(),
  createOrder:       vi.fn(),
  createPayment:     vi.fn(),
  transitionPayment: vi.fn(),
  transitionOrder:   vi.fn(),
}))

import {
  upsertUser,
  createOrder,
  createPayment,
  transitionPayment,
  transitionOrder,
} from "@/lib/supabase/db"

const validBody = {
  date:  "2024-02-14",
  city:  "São Paulo",
  email: "ana@email.com",
  name1: "Ana",
  name2: "Lucas",
  cpf:   "123.456.789-01",
}

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method:  "POST",
    body:    JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mocks de retorno padrão para o fluxo de sucesso
    vi.mocked(upsertUser).mockResolvedValue("user_abc")
    vi.mocked(createOrder).mockResolvedValue("order_abc123")
    vi.mocked(createPayment).mockResolvedValue("payment_xyz")
    vi.mocked(transitionPayment).mockResolvedValue(undefined)
    vi.mocked(transitionOrder).mockResolvedValue(undefined)
  })

  it("retorna 200 com orderId em caso de sucesso", async () => {
    const res  = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.orderId).toBe("order_abc123")
  })

  it("retorna 400 quando cpf está ausente", async () => {
    const { cpf: _, ...sem } = validBody
    const res  = await POST(makeRequest(sem))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe("Dados incompletos.")
  })

  it("retorna 400 quando email está ausente", async () => {
    const { email: _, ...sem } = validBody
    const res  = await POST(makeRequest(sem))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe("Dados incompletos.")
  })

  it("retorna 500 quando upsertUser lança erro", async () => {
    vi.mocked(upsertUser).mockRejectedValueOnce(new Error("conexão recusada"))

    const res  = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.message).toBe("conexão recusada")
  })

  it("retorna 500 quando createOrder lança erro", async () => {
    vi.mocked(createOrder).mockRejectedValueOnce(new Error("FK violation"))

    const res  = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.message).toBe("FK violation")
  })

  it("retorna 500 quando createPayment lança erro", async () => {
    vi.mocked(createPayment).mockRejectedValueOnce(new Error("DB timeout"))

    const res = await POST(makeRequest(validBody))

    expect(res.status).toBe(500)
  })

  it("passa os dados corretos para upsertUser e createOrder", async () => {
    await POST(makeRequest(validBody))

    expect(upsertUser).toHaveBeenCalledWith("ana@email.com", "123.456.789-01")
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_abc",
        name1:  "Ana",
        name2:  "Lucas",
        date:   "2024-02-14",
        city:   "São Paulo",
      }),
    )
  })

  it("chama transitionPayment e transitionOrder após criar pagamento", async () => {
    await POST(makeRequest(validBody))

    expect(transitionPayment).toHaveBeenCalledWith("payment_xyz", "confirmed")
    expect(transitionPayment).toHaveBeenCalledWith("payment_xyz", "succeeded")
    expect(transitionOrder).toHaveBeenCalledWith("order_abc123", "paid")
  })
})
