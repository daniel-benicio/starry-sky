import { NextRequest, NextResponse } from "next/server"
import { createResultToken } from "@/lib/result-token"
import type { ResultTokenData } from "@/lib/result-token"

/**
 * POST /api/generate-result
 *
 * Called by the checkout flow after a successful payment.
 * Creates a signed token with the order data and sets it as an HttpOnly cookie
 * so only the result page — accessed right after payment — can be loaded.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, city, email, name1, name2 } = body as Partial<ResultTokenData>

    if (!date || !name1 || !name2) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
    }

    const token = await createResultToken({
      date,
      city:  city  ?? "",
      email: email ?? "",
      name1,
      name2,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set("result_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      path:     "/result",
      maxAge:   60 * 60, // 1 hour — enough to download / share the poster
    })
    return response
  } catch {
    return NextResponse.json({ message: "Erro ao gerar resultado." }, { status: 500 })
  }
}
