import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const { email, name1, name2, date, city } = await req.json()

    const intent = await stripe.paymentIntents.create({
      amount: 2900,
      currency: "brl",
      metadata: {
        email:  email  ?? "",
        name1:  name1  ?? "",
        name2:  name2  ?? "",
        date:   date   ?? "",
        city:   city   ?? "",
      },
    })

    return NextResponse.json({ clientSecret: intent.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar intenção de pagamento."
    return NextResponse.json({ message }, { status: 500 })
  }
}
