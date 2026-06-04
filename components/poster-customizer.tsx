"use client"

import { RotateCcw, Type, Quote } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  FONT_OPTIONS,
  DEFAULT_QUOTE,
  MAX_QUOTE_LENGTH,
  type FontId,
  type PosterCustomization,
} from "@/lib/poster-customization"

interface PosterCustomizerProps {
  customization: PosterCustomization
  onFontChange:  (id: FontId) => void
  onQuoteChange: (quote: string) => void
  onQuoteReset:  () => void
}

export function PosterCustomizer({
  customization,
  onFontChange,
  onQuoteChange,
  onQuoteReset,
}: PosterCustomizerProps) {
  const quoteIsDefault = customization.quote === DEFAULT_QUOTE
  const charsLeft      = MAX_QUOTE_LENGTH - customization.quote.length

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-4 sm:p-5 space-y-5">

      {/* ── Fonte ───────────────────────────────────────────────────── */}
      <div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider mb-3">
          <Type className="h-3 w-3" />
          Fonte do pôster
        </p>

        <div className="flex flex-wrap gap-2">
          {FONT_OPTIONS.map(font => {
            const active = customization.fontId === font.id
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => onFontChange(font.id as FontId)}
                style={{ fontFamily: font.fontFamily }}
                className={[
                  "px-3.5 py-1.5 rounded-full text-sm border transition-all duration-200 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  active
                    ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/20"
                    : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                ].join(" ")}
              >
                {font.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Frase ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
            <Quote className="h-3 w-3" />
            Frase do pôster
          </p>

          {!quoteIsDefault && (
            <button
              type="button"
              onClick={onQuoteReset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              aria-label="Restaurar frase padrão"
            >
              <RotateCcw className="h-3 w-3" />
              Restaurar padrão
            </button>
          )}
        </div>

        <div className="relative">
          <Input
            value={customization.quote}
            onChange={e => onQuoteChange(e.target.value)}
            maxLength={MAX_QUOTE_LENGTH}
            placeholder="Escreva uma frase especial…"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary pr-14 text-sm"
          />
          <span
            className={[
              "absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none tabular-nums",
              charsLeft <= 10 ? "text-amber-400/70" : "text-muted-foreground/40",
            ].join(" ")}
          >
            {charsLeft}
          </span>
        </div>
      </div>

    </div>
  )
}
