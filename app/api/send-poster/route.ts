import { NextRequest, NextResponse } from "next/server"
import { createElement } from "react"
import { sendEmail } from "@/lib/email"
import { PosterEmail } from "@/emails/poster-email"

export async function POST(req: NextRequest) {
  try {
    const { email, name1, name2, formattedDate, city, posterDataUrl } = await req.json()

    if (!email || !name1 || !name2 || !formattedDate || !posterDataUrl) {
      return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
    }

    const base64 = (posterDataUrl as string).split(",")[1]
    if (!base64) {
      return NextResponse.json({ message: "Imagem inválida." }, { status: 400 })
    }

    const pngBuffer = Buffer.from(base64, "base64")

    await sendEmail({
      to:      email,
      subject: `✨ O céu de ${city} em ${formattedDate} — ${name1} & ${name2}`,
      react:   createElement(PosterEmail, { name1, name2, formattedDate, city }),
      attachments: [
        {
          filename: `ceu-${name1.toLowerCase().replace(/\s/g, "-")}-${name2.toLowerCase().replace(/\s/g, "-")}.png`,
          content:  pngBuffer,
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao enviar e-mail."
    return NextResponse.json({ message }, { status: 500 })
  }
}
