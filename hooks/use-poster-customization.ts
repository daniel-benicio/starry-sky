"use client"

import { useState, useCallback } from "react"
import {
  DEFAULT_CUSTOMIZATION,
  DEFAULT_QUOTE,
  MAX_QUOTE_LENGTH,
  type FontId,
  type PosterCustomization,
} from "@/lib/poster-customization"

export interface UsePosterCustomizationReturn {
  customization: PosterCustomization
  setFont:       (id: FontId) => void
  setQuote:      (quote: string) => void
  resetQuote:    () => void
}

/**
 * Gerencia o estado das customizações do pôster (fonte e frase).
 * Cada setter é memorizado para evitar re-renders desnecessários.
 */
export function usePosterCustomization(): UsePosterCustomizationReturn {
  const [customization, setCustomization] = useState<PosterCustomization>(DEFAULT_CUSTOMIZATION)

  const setFont = useCallback((fontId: FontId) => {
    setCustomization(prev => ({ ...prev, fontId }))
  }, [])

  const setQuote = useCallback((raw: string) => {
    setCustomization(prev => ({ ...prev, quote: raw.slice(0, MAX_QUOTE_LENGTH) }))
  }, [])

  const resetQuote = useCallback(() => {
    setCustomization(prev => ({ ...prev, quote: DEFAULT_QUOTE }))
  }, [])

  return { customization, setFont, setQuote, resetQuote }
}
