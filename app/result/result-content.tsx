"use client"

import { useRef, useCallback, useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { Download, Loader2, Share2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StarMapCanvas } from "@/components/star-map-canvas"
import { StarBackground } from "@/components/star-background"
import { computeSkyData } from "@/lib/astronomy"
import { geocodeCity } from "@/lib/geocoding"
import type { SkyData, Coordinates } from "@/lib/types"
import type { ResultTokenData } from "@/lib/result-token"
import { formatDate, getFirstAndLastName } from "@/lib/formatters"

// ─── Constants ────────────────────────────────────────────────────────────────

const POSTER_WIDTH  = 900
const POSTER_HEIGHT = 1020

const SAO_PAULO: Coordinates = { lat: -23.5505, lon: -46.6333, displayName: "São Paulo" }

const FALLBACK_SKY_DATA: SkyData = {
  stars: [],
  lines: [],
  moonPhase: "Lua Crescente",
  brightestPlanet: "Vênus",
  season: "Verão",
  dominantConstellation: "Órion",
}

async function buildPosterCanvas(
  sourceCanvas: HTMLCanvasElement,
  name1: string,
  name2: string,
  formattedDate: string,
): Promise<HTMLCanvasElement> {
  await document.fonts.ready

  const poster = document.createElement("canvas")
  poster.width  = POSTER_WIDTH
  poster.height = POSTER_HEIGHT

  const ctx = poster.getContext("2d")!
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

  ctx.drawImage(sourceCanvas, 0, 0, POSTER_WIDTH, POSTER_WIDTH)

  ctx.textAlign = "center"

  // Truncate to first + last name before drawing to avoid overflow
  const displayName1 = getFirstAndLastName(name1)
  const displayName2 = getFirstAndLastName(name2)

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font = `italic 42px 'Playfair Display', Georgia, serif`
  ctx.fillText(`${displayName1} & ${displayName2}`, POSTER_WIDTH / 2, POSTER_WIDTH + 52)

  ctx.fillStyle = "rgba(196, 181, 253, 0.8)"
  ctx.font = `20px 'Playfair Display', Georgia, serif`
  ctx.fillText(formattedDate, POSTER_WIDTH / 2, POSTER_WIDTH + 92)

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
  ctx.font = `italic 16px Georgia, serif`
  ctx.fillText("Naquela noite, o universo já sabia.", POSTER_WIDTH / 2, POSTER_WIDTH + 126)

  return poster
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResultContent({ date, city, name1, name2, email }: ResultTokenData) {
  const mapCanvasRef     = useRef<HTMLCanvasElement | null>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [canvasSize, setCanvasSize]   = useState(400)
  const [skyData, setSkyData]         = useState<SkyData | null>(null)

  const formattedDate = formatDate(date)
  const rawCoords     = useMemo(() => geocodeCity(city), [city])
  const coords        = rawCoords ?? SAO_PAULO
  const cityNotFound  = rawCoords === null

  // Truncated names for display — avoids overflows in title / poster
  const displayName1 = getFirstAndLastName(name1)
  const displayName2 = getFirstAndLastName(name2)

  useEffect(() => {
    let cancelled = false
    setSkyData(null)
    setTimeout(() => {
      try {
        const data = computeSkyData(date, coords.lat, coords.lon)
        if (!cancelled) setSkyData(data)
      } catch {
        if (!cancelled) setSkyData(FALLBACK_SKY_DATA)
      }
    }, 0)
    return () => { cancelled = true }
  }, [date, coords])

  useEffect(() => {
    const el = canvasWrapperRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setCanvasSize(Math.min(Math.floor(entry.contentRect.width), 400))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    mapCanvasRef.current = canvas
  }, [])

  const handleDownload = async () => {
    const source = mapCanvasRef.current
    if (!source) return

    setDownloading(true)
    try {
      const poster = await buildPosterCanvas(source, name1, name2, formattedDate)
      const link   = document.createElement("a")
      link.download = `ceu-${displayName1.toLowerCase().replace(/\s/g, "-")}-${displayName2.toLowerCase().replace(/\s/g, "-")}.png`
      link.href = poster.toDataURL("image/png")
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    const source    = mapCanvasRef.current
    const shareText = `✨ O céu de ${coords.displayName} em ${formattedDate} — ${displayName1} & ${displayName2}`
    const canShareFiles = typeof navigator.canShare === "function"

    if (source && navigator.share && canShareFiles) {
      try {
        const poster = await buildPosterCanvas(source, name1, name2, formattedDate)
        await new Promise<void>((resolve, reject) => {
          poster.toBlob(async (blob) => {
            if (!blob) { reject(new Error("blob null")); return }
            const file = new File([blob], `ceu-${displayName1}-${displayName2}.png`, { type: "image/png" })
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ title: "Céu do Nosso Dia", files: [file] })
            } else {
              await navigator.share({ title: "Céu do Nosso Dia", text: shareText })
            }
            resolve()
          })
        })
        return
      } catch {
        // fall through to text share
      }
    }

    if (navigator.share) {
      await navigator.share({ title: "Céu do Nosso Dia", text: shareText })
    } else {
      await navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <StarBackground />

      <header className="relative z-10 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg">Céu do Nosso Dia</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-8 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto">

          {/* Left Column - Star Map */}
          <div className="flex flex-col items-center text-center min-w-0">
            <div ref={canvasWrapperRef} className="w-full max-w-[400px]">
              {skyData ? (
                <StarMapCanvas
                  skyData={skyData}
                  size={canvasSize}
                  onReady={handleCanvasReady}
                />
              ) : (
                <div
                  className="rounded-full bg-muted/30 animate-pulse"
                  style={{ width: canvasSize, height: canvasSize }}
                />
              )}
            </div>
            <h2 className="mt-6 font-serif text-2xl sm:text-3xl italic text-foreground">
              {displayName1} & {displayName2}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{formattedDate}</p>
            <p className="mt-4 font-serif italic text-muted-foreground text-sm max-w-xs">
              Naquela noite, o universo já sabia.
            </p>
          </div>

          {/* Right Column - Details */}
          <div className="flex flex-col min-w-0">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
              Seu mapa está pronto
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Aqui está o céu exato de {coords.displayName} na noite de {formattedDate}.
              Cada estrela foi posicionada com precisão astronômica.
            </p>

            {cityNotFound && (
              <p className="text-xs text-amber-400/80 mb-4">
                Cidade não reconhecida — exibindo mapa de São Paulo.
              </p>
            )}

            <Card className="bg-card/50 border-border/50 mb-6">
              <CardContent className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Constelação visível
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">{skyData?.dominantConstellation ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Fase da lua
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">{skyData?.moonPhase ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Planeta mais brilhante
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">{skyData?.brightestPlanet ?? "Nenhum visível"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Estação
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">{skyData?.season ?? "—"}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 mb-4">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloading ? "Gerando…" : "Baixar pôster (PNG)"}
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>

            {email && (
              <p className="text-sm text-muted-foreground text-center mb-6">
                Também enviamos para {email}
              </p>
            )}

            <Separator className="mb-6 bg-border/50" />

            <div className="text-center">
              <p className="text-muted-foreground mb-3">Gostou? Presenteie outra pessoa</p>
              <Button variant="ghost" asChild>
                <Link href="/">Criar novo mapa</Link>
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
