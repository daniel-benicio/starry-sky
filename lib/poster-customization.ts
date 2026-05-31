/**
 * Domain layer — poster customization.
 *
 * Pure data: no React, no DOM, no side-effects.
 * Importável tanto em client components quanto em server code.
 */

// ─── Font options ─────────────────────────────────────────────────────────────

export interface FontOption {
  readonly id:         string
  /** Label exibido no seletor de fontes. */
  readonly label:      string
  /** CSS font-family stack — usado tanto em `style={{fontFamily}}` quanto em `ctx.font`. */
  readonly fontFamily: string
  /** Estilo aplicado à linha dos nomes no pôster. */
  readonly style:      "normal" | "italic"
}

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    id:         "playfair",
    label:      "Playfair",
    fontFamily: '"Playfair Display", Georgia, serif',
    style:      "italic",
  },
  {
    id:         "dancing",
    label:      "Dancing Script",
    fontFamily: '"Dancing Script", cursive',
    style:      "normal", // já é cursiva por natureza — italic duplicaria o efeito
  },
  {
    id:         "lora",
    label:      "Lora",
    fontFamily: '"Lora", Georgia, serif',
    style:      "italic",
  },
  {
    id:         "cormorant",
    label:      "Cormorant",
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    style:      "italic",
  },
] as const

export type FontId = (typeof FONT_OPTIONS)[number]["id"]

/** Retorna a opção de fonte pelo id, ou a primeira opção como fallback. */
export function getFontOption(id: FontId): FontOption {
  return FONT_OPTIONS.find(f => f.id === id) ?? FONT_OPTIONS[0]
}

// ─── Customization model ──────────────────────────────────────────────────────

export interface PosterCustomization {
  fontId: FontId
  quote:  string
}

export const DEFAULT_QUOTE    = "Naquela noite, o universo já sabia."
export const MAX_QUOTE_LENGTH = 60

export const DEFAULT_CUSTOMIZATION: PosterCustomization = {
  fontId: "playfair",
  quote:  DEFAULT_QUOTE,
}
