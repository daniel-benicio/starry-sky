import { NextRequest, NextResponse } from "next/server"
import { createOrder } from "@/lib/pagarme"

export async function POST(req: NextRequest) {
  try {
    const { cardToken, date, city, email, name1, name2 } = await req.json()

    if (!cardToken || !email) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
    }

    const secretKey = process.env.PAGARME_SECRET_KEY
    if (!secretKey) {
      console.error("PAGARME_SECRET_KEY not set")
      return NextResponse.json({ message: "Configuração de pagamento inválida." }, { status: 500 })
    }

    const order = await createOrder(
      {
        customerName: `${name1} ${name2}`.trim() || "Cliente",
        email,
        cardToken,
        metadata: { date, city, name1, name2 },
      },
      secretKey
    )

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno. Tente novamente em instantes."
    const isClientError = /recusado|inválido/i.test(message)
    return NextResponse.json({ message }, { status: isClientError ? 400 : 500 })
  }
}
