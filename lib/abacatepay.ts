const BASE_URL = "https://api.abacatepay.com/v2"

function getHeaders() {
  const key = process.env.ABACATE_PAY_API_KEY
  if (!key) throw new Error("ABACATE_PAY_API_KEY env var is required")
  return {
    "Authorization": `Bearer ${key}`,
    "Content-Type":  "application/json",
  }
}

export type ChargeStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED"

export interface AbacateCharge {
  id:            string
  status:        ChargeStatus
  brCode:        string
  brCodeBase64:  string
  amount:        number
  expiresAt:     string
}

export async function createPixCharge(params: {
  amount:      number
  description: string
  metadata?: Record<string, string>
  expiresIn?: number
}): Promise<AbacateCharge> {
  const res = await fetch(`${BASE_URL}/transparents/create`, {
    method:  "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount:      params.amount,
        description: params.description,
        expiresIn:   params.expiresIn ?? 3600,
        metadata:    params.metadata,
      },
    }),
  })

  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? "Erro ao criar cobrança PIX.")
  return json.data as AbacateCharge
}

export async function getPixChargeStatus(id: string): Promise<ChargeStatus> {
  const res = await fetch(`${BASE_URL}/transparents/check?id=${encodeURIComponent(id)}`, {
    headers: getHeaders(),
  })

  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? "Erro ao consultar cobrança.")
  return json.data.status as ChargeStatus
}
