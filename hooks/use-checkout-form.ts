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

    // TODO: integrar com Pagarme antes de ir para produção
    await new Promise((res) => setTimeout(res, 800))
    router.push(`/result?${new URLSearchParams(order).toString()}`)
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
