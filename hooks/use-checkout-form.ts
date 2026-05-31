"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStripe, useElements, CardNumberElement } from "@stripe/react-stripe-js"
import { formatCpf } from "@/lib/formatters"
import type { OrderData } from "@/types/order"

export interface CardFields {
  name: string
  document: string
  brand: string
}

export interface UseCheckoutFormReturn {
  fields: CardFields
  isCVVFocused: boolean
  isLoading: boolean
  error: string
  setField: (key: keyof Omit<CardFields, "brand">, value: string) => void
  setBrand: (brand: string) => void
  onCVVFocus: () => void
  onCVVBlur: () => void
  onSubmit: (e: React.SyntheticEvent) => Promise<void>
}

export function useCheckoutForm(order: OrderData, clientSecret: string): UseCheckoutFormReturn {
  const router   = useRouter()
  const stripe   = useStripe()
  const elements = useElements()

  const [fields, setFields] = useState<CardFields>({ name: "", document: "", brand: "" })
  const [isCVVFocused, setIsCVVFocused] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState("")

  const setField = (key: keyof Omit<CardFields, "brand">, value: string) => {
    const formatted = key === "document" ? formatCpf(value) : value
    setFields((prev) => ({ ...prev, [key]: formatted }))
  }

  const setBrand = (brand: string) => setFields((prev) => ({ ...prev, brand }))

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError("")

    try {
      const cardElement = elements.getElement(CardNumberElement)
      if (!cardElement) throw new Error("Elemento de cartão não encontrado.")

      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name:  fields.name,
            email: order.email,
          },
        },
      })

      if (stripeError) throw new Error(stripeError.message ?? "Pagamento recusado.")
      if (paymentIntent?.status !== "succeeded") throw new Error("Pagamento não concluído.")

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          cpf:   fields.document,
          ...order,
        }),
      })

      if (!checkoutRes.ok) {
        const { message } = await checkoutRes.json().catch(() => ({}))
        throw new Error(message ?? "Erro ao registrar pedido.")
      }

      const resultRes = await fetch("/api/generate-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      })

      if (!resultRes.ok) {
        const { message } = await resultRes.json().catch(() => ({}))
        throw new Error(message ?? "Erro ao processar resultado.")
      }

      router.push("/result")
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
    setBrand,
    onCVVFocus: () => setIsCVVFocused(true),
    onCVVBlur:  () => setIsCVVFocused(false),
    onSubmit,
  }
}
