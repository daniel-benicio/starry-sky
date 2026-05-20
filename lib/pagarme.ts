const API_URL = "https://api.pagar.me/core/v5"

export interface PagarmeCardData {
  number: string
  holderName: string
  holderDocument: string
  expMonth: number
  expYear: number
  cvv: string
}

export async function tokenizeCard(card: PagarmeCardData, publicKey: string): Promise<string> {
  const res = await fetch(`${API_URL}/tokens?appId=${publicKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "card",
      card: {
        number: card.number.replace(/\s/g, ""),
        holder_name: card.holderName,
        holder_document: card.holderDocument.replace(/\D/g, ""),
        exp_month: card.expMonth,
        exp_year: card.expYear,
        cvv: card.cvv,
      },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? "Erro ao tokenizar cartão.")
  return json.id
}

export interface PagarmeOrderData {
  customerName: string
  email: string
  cardToken: string
  metadata: Record<string, string>
}

export async function createOrder(data: PagarmeOrderData, secretKey: string) {
  const auth = Buffer.from(`${secretKey}:`).toString("base64")

  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      items: [
        {
          amount: 2900,
          description: "Mapa Estelar Personalizado — Céu do Nosso Dia",
          quantity: 1,
          code: "star-map-01",
        },
      ],
      customer: {
        name: data.customerName,
        email: data.email,
        type: "individual",
      },
      payments: [
        {
          payment_method: "credit_card",
          credit_card: {
            recurrence: false,
            installments: 1,
            statement_descriptor: "CEU DO NOSSO DIA",
            card_token: data.cardToken,
          },
        },
      ],
      metadata: data.metadata,
    }),
  })

  const json = await res.json()
  const charge = json.charges?.[0]
  const status = charge?.status ?? json.status

  if (!res.ok || status === "failed") {
    const message =
      charge?.last_transaction?.gateway_response?.errors?.[0]?.message ??
      json.message ??
      "Pagamento recusado. Verifique os dados do cartão."
    throw new Error(message)
  }

  return json
}
