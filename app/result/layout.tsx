import { Dancing_Script, Lora, Cormorant_Garamond } from "next/font/google"

const dancing = Dancing_Script({
  subsets:  ["latin"],
  variable: "--font-dancing",
})

const lora = Lora({
  subsets:  ["latin"],
  variable: "--font-lora",
})

const cormorant = Cormorant_Garamond({
  subsets:  ["latin"],
  weight:   ["400", "600"],
  variable: "--font-cormorant",
})

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dancing.variable} ${lora.variable} ${cormorant.variable}`}>
      {children}
    </div>
  )
}
