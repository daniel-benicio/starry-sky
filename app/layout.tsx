import type { Metadata } from 'next'
import { Playfair_Display, Inter, Dancing_Script, Lora, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

// Fontes extras para customização do pôster
const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
})

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight:  ["400", "600"],
  variable: "--font-cormorant",
})

export const metadata: Metadata = {
  title: 'Céu do Nosso Dia | O céu na noite em que tudo começou',
  description: 'Crie um mapa estelar personalizado com a posição real das estrelas na data especial do seu relacionamento. O presente perfeito para o Dia dos Namorados.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body suppressHydrationWarning className={`${playfair.variable} ${inter.variable} ${dancing.variable} ${lora.variable} ${cormorant.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
