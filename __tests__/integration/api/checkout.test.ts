import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockRetrieve } = vi.hoisted(() => ({ mockRetrieve: vi.fn() }))

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { retrieve: mockRetrieve } }),
}))

vi.mock("@/lib/supabase/db", () => ({
  upsertUser:        vi.fn(),
  createOrder:       vi.fn(),
  createPayment:     vi.fn(),
  transitionPayment: vi.fn(),
  transitionOrder:   vi.fn(),
}))

vi.mock("@/lib/nominatim", () => ({
  nominatimGeocode: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/geocoding", () => ({
  geocodeCity: vi.fn().mockReturnValue(null),
}))

vi.mock("@/lib/result-token", () => ({
  createResultToken: vi.fn().mockResolvedValue("fake-result-token"),
}))

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from "@/app/api/checkout/route"
import {
  upsertUser,
  createOrder,
  createPayment,
  transitionPayment,
  transitionOrder,
} from "@/lib/supabase/db"

const PAYMENT_INTENT_ID = "pi_test_123"

const validBody = {
  paymentIntentId: PAYMENT_INTENT_ID,
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
    mockRetrieve.mockResolvedValue({ status: "succeeded" })
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

  it("retorna 400 quando paymentIntentId está ausente", async () => {
    const { paymentIntentId: _, ...sem } = validBody
    const res  = await POST(makeRequest(sem))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe("Dados incompletos.")
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

  it("retorna 400 quando PaymentIntent não está succeeded", async () => {
    mockRetrieve.mockResolvedValueOnce({ status: "requires_payment_method" })

    const res  = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.message).toBe("Pagamento não confirmado.")
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

  it("chama transitionPayment e transitionOrder com paymentIntentId", async () => {
    await POST(makeRequest(validBody))

    expect(transitionPayment).toHaveBeenCalledWith("payment_xyz", "confirmed", PAYMENT_INTENT_ID)
    expect(transitionPayment).toHaveBeenCalledWith("payment_xyz", "succeeded", PAYMENT_INTENT_ID)
    expect(transitionOrder).toHaveBeenCalledWith("order_abc123", "paid")
  })
})
