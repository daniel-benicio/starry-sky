"use client"

import type { CardFields } from "@/hooks/use-checkout-form"

function detectBrand(number: string): string {
  const n = number.replace(/\s/g, "")
  if (n.startsWith("4")) return "VISA"
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "MASTER"
  if (/^3[47]/.test(n)) return "AMEX"
  return ""
}

function toGroups(number: string): string[] {
  const raw = number.replace(/\s/g, "")
  return Array.from({ length: 4 }, (_, i) => raw.slice(i * 4, i * 4 + 4).padEnd(4, "•"))
}

const CARD_GRADIENT = "linear-gradient(135deg, #1e1b4b 0%, #3730a3 45%, #1a1040 100%)"

const filledColor  = "rgba(255,255,255,0.92)"
const emptyColor   = "rgba(255,255,255,0.22)"
const labelColor   = "rgba(255,255,255,0.3)"

interface CreditCardVisualProps extends Pick<CardFields, "number" | "name" | "expiry" | "cvv"> {
  isFlipped: boolean
}

export function CreditCardVisual({ number, name, expiry, cvv, isFlipped }: CreditCardVisualProps) {
  const groups = toGroups(number)
  const brand  = detectBrand(number)
  const filledDigits = number.replace(/\s/g, "").length

  return (
    <div style={{ perspective: "1200px" }} className="w-full mb-8">
      <div
        className="card-glow"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          height: "190px",
          borderRadius: "16px",
        }}
      >
        <CardFront
          groups={groups}
          filledDigits={filledDigits}
          brand={brand}
          name={name}
          expiry={expiry}
          filledColor={filledColor}
          emptyColor={emptyColor}
          labelColor={labelColor}
          gradient={CARD_GRADIENT}
        />
        <CardBack cvv={cvv} gradient={CARD_GRADIENT} />
      </div>
    </div>
  )
}

interface CardFrontProps {
  groups: string[]
  filledDigits: number
  brand: string
  name: string
  expiry: string
  filledColor: string
  emptyColor: string
  labelColor: string
  gradient: string
}

function CardFront({ groups, filledDigits, brand, name, expiry, filledColor, emptyColor, labelColor, gradient }: CardFrontProps) {
  return (
    <div
      className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: gradient }}
    >
      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="absolute right-6 -bottom-14 w-36 h-36 rounded-full pointer-events-none" style={{ background: "rgba(167,139,250,0.12)" }} />

      {/* Chip + brand */}
      <div className="relative flex justify-between items-center">
        <div
          className="w-10 h-7 rounded-md flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #c8930a, #f0c040, #b87d0a)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.3)" }}
        >
          <div className="w-6 h-4 rounded-sm" style={{ border: "1px solid rgba(180,120,0,0.5)" }} />
        </div>
        <span className="text-xs font-bold tracking-[0.2em] select-none" style={{ color: "rgba(255,255,255,0.45)" }}>
          {brand || "• • • •"}
        </span>
      </div>

      {/* Number */}
      <div className="relative flex gap-2 sm:gap-3 font-mono text-sm sm:text-base select-none">
        {groups.map((group, i) => (
          <span
            key={i}
            className="tracking-wider sm:tracking-widest transition-all duration-200"
            style={{ color: filledDigits > i * 4 ? filledColor : emptyColor }}
          >
            {group}
          </span>
        ))}
      </div>

      {/* Name + expiry */}
      <div className="relative flex justify-between items-end gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: labelColor }}>Titular</p>
          <p className="text-sm font-medium tracking-wide truncate transition-all duration-200" style={{ color: name ? filledColor : emptyColor }}>
            {name ? name.toUpperCase() : "NOME DO TITULAR"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: labelColor }}>Validade</p>
          <p className="text-sm font-mono tracking-wider transition-all duration-200" style={{ color: expiry ? filledColor : emptyColor }}>
            {expiry || "MM/AA"}
          </p>
        </div>
      </div>
    </div>
  )
}

function CardBack({ cvv, gradient }: { cvv: string; gradient: string }) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: gradient }}
    >
      <div className="absolute -left-8 bottom-4 w-32 h-32 rounded-full pointer-events-none" style={{ background: "rgba(167,139,250,0.1)" }} />

      <div className="w-full mt-8 h-10" style={{ background: "rgba(0,0,0,0.8)" }} />

      <div className="px-5 mt-5">
        <div className="rounded-md h-9 flex items-center justify-end px-4" style={{ background: "rgba(255,255,255,0.92)" }}>
          <span className="font-mono text-sm tracking-[0.4em] select-none" style={{ color: "#1e1b4b" }}>
            {cvv || "•••"}
          </span>
        </div>
        <p className="text-xs text-right mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>CVV</p>
      </div>
    </div>
  )
}
