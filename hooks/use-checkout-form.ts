"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCardNumber, formatExpiry, formatCpf } from "@/lib/formatters"
import type { OrderData } from "@/types/order"

export interface CardFields {
  number: string
  name: string
  document: string
  expiry: string
  cvv: string
}

const FIELD_FORMATTERS: Record<keyof CardFields, (v: string) => string> = {
  number:   formatCardNumber,
  name:     (v) => v,
  document: formatCpf,
  expiry:   formatExpiry,
  cvv:      (v) => v.replace(/\D/g, "").slice(0, 4),
}

export interface UseCheckoutFormReturn {
  fields: CardFields
  isCVVFocused: boolean
  isLoading: boolean
  error: string
  setField: (key: keyof CardFields, rawValue: string) => void
  onCVVFocus: () => void
  onCVVBlur: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}

export function useCheckoutForm(order: OrderData): UseCheckoutFormReturn {
  const router = useRouter()

  const [fields, setFields] = useState<CardFields>({
    number: "", name: "", document: "", expiry: "", cvv: "",
  })
  const [isCVVFocused, setIsCVVFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const setField = (key: keyof CardFields, rawValue: string) => {
    setFields((prev) => ({ ...prev, [key]: FIELD_FORMATTERS[key](rawValue) }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // TODO: integrar com Pagarme antes de ir para produção
      await new Promise((res) => setTimeout(res, 800))

      // Gera o token assinado e define o cookie result_token antes de redirecionar.
      // Sem esse cookie o middleware bloqueia a entrada na página de resultado.
      const res = await fetch("/api/generate-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      })

      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}))
        throw new Error(message ?? "Erro ao processar resultado.")
      }

      router.push("/result")
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar pagamento. Tente novamente.")
      setIsLoading(false)
    }
  }

  return {
    fields,
    isCVVFocused,
    isLoading,
    error,
    setField,
    onCVVFocus: () => setIsCVVFocused(true),
    onCVVBlur:  () => setIsCVVFocused(false),
    onSubmit,
  }
}
