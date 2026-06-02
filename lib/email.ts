import { Resend } from "resend"
import type { ReactElement } from "react"

// Instantiated lazily so build-time collection doesn't fail without the API key
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "Céu do Nosso Dia <noreply@ceudossodia.com.br>"

export async function sendEmail(opts: {
  to:      string
  subject: string
  react:   ReactElement
  attachments?: Array<{ filename: string; content: Buffer }>
}) {
  return getResend().emails.send({
    from:        FROM,
    to:          opts.to,
    subject:     opts.subject,
    react:       opts.react,
    attachments: opts.attachments,
  })
}
