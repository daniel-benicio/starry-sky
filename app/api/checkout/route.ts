import { NextRequest, NextResponse } from "next/server"
import { createElement } from "react"
import { getStripe } from "@/lib/stripe"
import { upsertUser, createOrder, createPayment, transitionPayment, transitionOrder } from "@/lib/supabase/db"
import { sendEmail } from "@/lib/email"
import { ConfirmationEmail } from "@/emails/confirmation-email"
import { formatDate } from "@/lib/formatters"
import { createResultToken } from "@/lib/result-token"
import { nominatimGeocode } from "@/lib/nominatim"
import { geocodeCity } from "@/lib/geocoding"

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
    const paymentId = await createPayment({ orderId, amountCents: 2499, providerPaymentId: paymentIntentId })

    await transitionPayment(paymentId, "confirmed", paymentIntentId)
    await transitionPayment(paymentId, "succeeded", paymentIntentId)
    await transitionOrder(orderId, "paid")

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ceuestrelado.online"

    let lat: number | undefined
    let lon: number | undefined
    if (city) {
      const coords = (await nominatimGeocode(city)) ?? geocodeCity(city)
      if (coords) { lat = coords.lat; lon = coords.lon }
    }

    const resultToken = await createResultToken({ date, city, email, name1, name2, lat, lon })
    const resultUrl   = `${baseUrl}/result?token=${resultToken}`

    // Fire-and-forget — don't fail the checkout if the email fails
    sendEmail({
      to:      email,
      subject: `✨ Seu mapa estelar está pronto, ${name1}!`,
      react:   createElement(ConfirmationEmail, {
        name1,
        name2,
        date:      formatDate(date),
        city,
        resultUrl,
      }),
    }).catch((err) => {
      console.error("[checkout] confirmation email failed:", err)
    })

    return NextResponse.json({ success: true, orderId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno. Tente novamente em instantes."
    return NextResponse.json({ message }, { status: 500 })
  }
}
