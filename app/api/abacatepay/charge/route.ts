import { NextRequest, NextResponse } from "next/server"
import { createPixCharge } from "@/lib/abacatepay"

export async function POST(req: NextRequest) {
  try {
    const { name1, email, cpf, date, city, name2 } = await req.json()

    if (!email || !cpf || !name1) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
    }

    const charge = await createPixCharge({
      amount:      2499,
      description: "Mapa Estelar Personalizado — Céu Estrelado",
      metadata: { date, city, name1, name2: name2 ?? "", email },
      expiresIn: 3600,
    })

    return NextResponse.json({
      id:           charge.id,
      brCode:       charge.brCode,
      brCodeBase64: charge.brCodeBase64,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar cobrança PIX."
    return NextResponse.json({ message }, { status: 500 })
  }
}
