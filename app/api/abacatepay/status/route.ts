import { NextRequest, NextResponse } from "next/server"
import { getPixChargeStatus } from "@/lib/abacatepay"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ message: "ID obrigatório." }, { status: 400 })

  try {
    const status = await getPixChargeStatus(id)
    return NextResponse.json({ status })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao consultar pagamento."
    return NextResponse.json({ message }, { status: 500 })
  }
}
