"use client"

import { Lock } from "lucide-react"
import { StarMapPreview } from "@/components/star-map-preview"
import { formatDate } from "@/lib/formatters"
import type { OrderData } from "@/types/order"

const PRICE_DISPLAY = "R$ 24,99"

interface OrderSummaryProps extends Pick<OrderData, "date" | "city" | "name1" | "name2"> {}

export function OrderSummary({ date, city, name1, name2 }: OrderSummaryProps) {
  const names         = name1 && name2 ? `${name1} & ${name2}` : ""
  const formattedDate = formatDate(date)

  return (
    <div className="lg:sticky lg:top-8">
      <h2 className="font-serif text-2xl mb-6 text-foreground">Resumo do pedido</h2>

      <div className="flex justify-center mb-6">
        <StarMapPreview date={date} names={names} />
      </div>

      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-xl text-foreground leading-snug">
              {names || "Mapa Estelar Personalizado"}
            </p>
            {formattedDate && <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>}
            {city         && <p className="text-sm text-muted-foreground">{city}</p>}
          </div>
          <p className="font-serif text-2xl text-primary shrink-0">R$&nbsp;24,99</p>
        </div>

        <div className="border-t border-border/50 pt-4 flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Total</span>
          <span className="font-semibold text-foreground">{PRICE_DISPLAY}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Pagamento seguro
        </span>
        <span aria-hidden>•</span>
        <span>Certificado SSL</span>
        <span aria-hidden>•</span>
        <span>Entrega imediata</span>
      </div>
    </div>
  )
}
