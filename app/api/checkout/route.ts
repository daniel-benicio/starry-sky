import { NextRequest, NextResponse } from "next/server"
import { upsertUser, createOrder, createPayment, transitionPayment, transitionOrder } from "@/lib/supabase/db"

export async function POST(req: NextRequest) {
  const { date, city, email, name1, name2 } = await req.json()

  if (!email) {
    return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
  }

  const userId    = await upsertUser(email, `${name1} ${name2}`.trim())
  const orderId   = await createOrder({ userId, name1, name2, date, city })
  const paymentId = await createPayment({ orderId, amountCents: 2900 })

  await transitionPayment(paymentId, "confirmed")
  await transitionPayment(paymentId, "succeeded")
  await transitionOrder(orderId, "paid")

  return NextResponse.json({ success: true, orderId })
}
