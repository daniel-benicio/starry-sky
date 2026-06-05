"use client"

import { useEffect, useState } from "react"
import { computeSkyData } from "@/lib/astronomy"
import { geocodeCity } from "@/lib/geocoding"
import type { SkyData } from "@/lib/types"
import { StarMapCanvas } from "./star-map-canvas"

const DEFAULT_DATE  = "2020-02-14"
const DEFAULT_NAMES = "Ana & Pedro"
const SAO_PAULO     = { lat: -23.5505, lon: -46.6333 }

interface StarMapPreviewProps {
  date?:  string
  names?: string
  city?:  string
}

export function StarMapPreview({ date, names, city }: StarMapPreviewProps) {
  const [skyData, setSkyData] = useState<SkyData | null>(null)

  const resolvedDate  = date  || DEFAULT_DATE
  const resolvedNames = names || DEFAULT_NAMES

  const resolvedDate8 = resolvedDate.replace(/\//g, "-")
  const isoDate = resolvedDate8.includes("-") ? resolvedDate8 : ""

  useEffect(() => {
    setSkyData(null)
    const cityCoords = city ? geocodeCity(city) : null
    const coords     = cityCoords ?? SAO_PAULO

    const t = setTimeout(() => {
      try {
        const data = computeSkyData(isoDate || DEFAULT_DATE, coords.lat, coords.lon)
        setSkyData(data)
      } catch {
        // silently keep null — canvas stays hidden
      }
    }, 0)

    return () => clearTimeout(t)
  }, [isoDate, city])

  const labelDate = (() => {
    const d = isoDate || DEFAULT_DATE
    const [y, m, day] = d.split("-").map(Number)
    if (!y || !m || !day) return ""
    return new Date(y, m - 1, day).toLocaleDateString("pt-BR", {
      day: "numeric", month: "long", year: "numeric",
    })
  })()

  return (
    <div className="relative w-full max-w-85">
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative rounded-full border border-primary/20 bg-background/50 backdrop-blur-sm overflow-hidden">
        {skyData ? (
          <div className="relative">
            <StarMapCanvas skyData={skyData} size={340} />
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
              <p className="font-serif text-sm text-foreground/80 italic drop-shadow-md">
                {resolvedNames}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 drop-shadow-md">
                {labelDate}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-85 h-85 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
