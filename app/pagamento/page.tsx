"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Sparkles, Check, ChevronRight } from "lucide-react"
import { StarBackground } from "@/components/star-background"
import { CheckoutForm } from "@/components/checkout-form"
import { OrderSummary } from "@/components/order-summary"
import type { OrderData } from "@/types/order"

function useOrderFromParams(): OrderData {
  const p = useSearchParams()
  return {
    date:  p.get("date")  ?? "",
    city:  p.get("city")  ?? "",
    email: p.get("email") ?? "",
    name1: p.get("name1") ?? "",
    name2: p.get("name2") ?? "",
  }
}

function CheckoutSteps() {
  return (
    <nav className="hidden md:flex items-center gap-2 text-sm" aria-label="Progresso do pedido">
      <span className="flex items-center gap-1.5 text-primary">
        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </span>
        Seus dados
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <span className="flex items-center gap-1.5 text-foreground font-medium">
        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          2
        </span>
        Pagamento
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="w-5 h-5 rounded-full border border-border text-xs flex items-center justify-center">
          3
        </span>
        Seu mapa
      </span>
    </nav>
  )
}

function PaymentContent() {
  const order = useOrderFromParams()

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <StarBackground />

      <header className="relative z-10 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg">Céu do Nosso Dia</span>
          </Link>
          <CheckoutSteps />
        </div>
      </header>

      <main className="relative z-10 w-full px-4 py-10 lg:py-16">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-start max-w-5xl mx-auto w-full">
          <div className="order-2 lg:order-1 animate-fade-in-up min-w-0 w-full" style={{ animationDelay: "120ms" }}>
            <OrderSummary {...order} />
          </div>
          <div className="order-1 lg:order-2 min-w-0 w-full">
            <CheckoutForm {...order} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
