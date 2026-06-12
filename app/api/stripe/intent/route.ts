import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const { email, name1, name2, date, city } = await req.json()

    if (!email || !name1 || !name2 || !date || !city) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
    }

    const intent = await getStripe().paymentIntents.create({
      amount: 499,
      currency: "brl",
      description: "Mapa Estelar Personalizado — Céu do Nosso Dia",
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
