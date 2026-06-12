"use client"

import { useState } from "react"
import { StarMapPreview } from "./star-map-preview"
import { OrderForm, OrderFormData } from "./order-form"

interface HeroSectionProps {
  onSubmit?: (data: OrderFormData) => void
}

export function HeroSection({ onSubmit }: HeroSectionProps) {
  const [formData, setFormData] = useState({ date: "", names: "", email: "" })

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-24 relative z-10">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <p className="text-primary font-medium mb-4 tracking-wide uppercase text-sm">
              Céu do Nosso Dia
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight text-balance">
              O céu na noite em que tudo começou
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Crie um mapa estelar personalizado com a posição exata das estrelas 
              na data em que vocês se conheceram. Um presente eterno para quem você ama.
            </p>
            
            {/* Pricing Anchor */}
            <div className="mb-8 p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm max-w-md mx-auto lg:mx-0">
              <div className="flex items-baseline justify-center lg:justify-start gap-2">
                <span className="font-serif text-5xl text-foreground">R$ 4,99</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2 text-center lg:text-left">
                pagamento único &bull; sem assinatura &bull; entrega imediata
              </p>
            </div>

            <OrderForm onFormChange={setFormData} onSubmit={onSubmit} />
          </div>

          {/* Right: Star Map Preview */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2">
            <StarMapPreview date={formData.date} names={formData.names} />
          </div>
        </div>
      </div>
    </section>
  )
}
