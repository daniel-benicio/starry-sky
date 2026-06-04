import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Apenas em desenvolvimento." }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ message: "id obrigatório." }, { status: 400 })

  const key = process.env.ABACATE_PAY_API_KEY
  const res = await fetch(
    `https://api.abacatepay.com/v2/transparents/simulate-payment?id=${encodeURIComponent(id)}`,
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({}),
    },
  )

  const json = await res.json()
  if (!res.ok) return NextResponse.json({ message: json.error ?? "Erro ao simular." }, { status: 500 })
  return NextResponse.json({ success: true })
}
