import { NextRequest, NextResponse } from "next/server"
import { createElement } from "react"
import { getPixChargeStatus } from "@/lib/abacatepay"
import { upsertUser, createOrder, createPayment, transitionPayment, transitionOrder } from "@/lib/supabase/db"
import { sendEmail } from "@/lib/email"
import { ConfirmationEmail } from "@/emails/confirmation-email"
import { formatDate } from "@/lib/formatters"
import { createResultToken } from "@/lib/result-token"
import { nominatimGeocode } from "@/lib/nominatim"
import { geocodeCity } from "@/lib/geocoding"

export async function POST(req: NextRequest) {
  try {
    const { chargeId, date, city, email, name1, name2, cpf } = await req.json()

    if (!email || !cpf || !chargeId) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
    }

    const status = await getPixChargeStatus(chargeId)
    if (status !== "PAID") {
      return NextResponse.json({ message: "Pagamento não confirmado." }, { status: 400 })
    }

    const userId    = await upsertUser(email, cpf)
    const orderId   = await createOrder({ userId, name1, name2, date, city })
    const paymentId = await createPayment({ orderId, amountCents: 2499, providerPaymentId: chargeId })

    await transitionPayment(paymentId, "confirmed", chargeId)
    await transitionPayment(paymentId, "succeeded", chargeId)
    await transitionOrder(orderId, "paid")

    let lat: number | undefined
    let lon: number | undefined
    if (city) {
      const coords = (await nominatimGeocode(city)) ?? geocodeCity(city)
      if (coords) { lat = coords.lat; lon = coords.lon }
    }

    const resultToken = await createResultToken({ date, city, email, name1, name2, lat, lon })
    const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ceuestrelado.online"
    const resultUrl   = `${baseUrl}/result?token=${resultToken}`

    sendEmail({
      to:      email,
      subject: `✨ Seu mapa estelar está pronto, ${name1}!`,
      react:   createElement(ConfirmationEmail, {
        name1, name2,
        date: formatDate(date),
        city, resultUrl,
      }),
    }).catch((err) => {
      console.error("[pix-confirm] email failed:", err)
    })

    return NextResponse.json({ success: true, orderId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno. Tente novamente."
    return NextResponse.json({ message }, { status: 500 })
  }
}
