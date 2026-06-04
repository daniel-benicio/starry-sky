import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { upsertUser, createOrder, createPayment, transitionPayment, transitionOrder } from "@/lib/supabase/db"

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, date, city, email, name1, name2, cpf } = await req.json()

    if (!email || !cpf || !paymentIntentId) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
    }

    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId)
    if (intent.status !== "succeeded") {
      return NextResponse.json({ message: "Pagamento não confirmado." }, { status: 400 })
    }

    const userId    = await upsertUser(email, cpf)
    const orderId   = await createOrder({ userId, name1, name2, date, city })
    const paymentId = await createPayment({ orderId, amountCents: 2900, providerPaymentId: paymentIntentId })

    await transitionPayment(paymentId, "confirmed", paymentIntentId)
    await transitionPayment(paymentId, "succeeded", paymentIntentId)
    await transitionOrder(orderId, "paid")

    return NextResponse.json({ success: true, orderId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno. Tente novamente em instantes."
    return NextResponse.json({ message }, { status: 500 })
  }
}
