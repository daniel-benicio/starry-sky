import { NextRequest, NextResponse } from "next/server"
import { createResultToken } from "@/lib/result-token"
import type { ResultTokenData } from "@/lib/result-token"
import { nominatimGeocode } from "@/lib/nominatim"
import { geocodeCity } from "@/lib/geocoding"

/**
 * POST /api/generate-result
 *
 * Chamado pelo checkout após pagamento confirmado.
 *
 * Resolve as coordenadas da cidade em duas camadas:
 *   1. Nominatim (OpenStreetMap) — cobertura global, sem custo
 *   2. Fallback: tabela estática local (geocoding.ts)
 *
 * As coordenadas resolvidas ficam gravadas no token assinado, então a
 * página /result as lê diretamente sem nenhuma chamada de rede adicional.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, city, email, name1, name2 } = body as Partial<ResultTokenData>

    if (!date || !name1 || !name2) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
    }

    const resolvedCity = city ?? ""

    // ── Geocodificação: Nominatim → fallback estático ─────────────────────
    let lat: number | undefined
    let lon: number | undefined

    if (resolvedCity) {
      const coords = (await nominatimGeocode(resolvedCity)) ?? geocodeCity(resolvedCity)
      if (coords) {
        lat = coords.lat
        lon = coords.lon
      }
    }

    const token = await createResultToken({
      date,
      city:  resolvedCity,
      email: email ?? "",
      name1,
      name2,
      lat,
      lon,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set("result_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      path:     "/result",
      maxAge:   60 * 60, // 1 hora — suficiente para baixar / compartilhar o pôster
    })
    return response
  } catch {
    return NextResponse.json({ message: "Erro ao gerar resultado." }, { status: 500 })
  }
}
