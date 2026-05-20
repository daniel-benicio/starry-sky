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
  onSubmit: (e: React.SyntheticEvent) => Promise<void>
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

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Erro ao processar pedido.")

      router.push(`/result?${new URLSearchParams(order as unknown as Record<string, string>).toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.")
    } finally {
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
