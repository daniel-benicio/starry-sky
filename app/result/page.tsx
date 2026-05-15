"use client"

import { Suspense, useRef, useCallback, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Download, Share2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StarMapCanvas } from "@/components/star-map-canvas"
import { StarBackground } from "@/components/star-background"
import { computeSkyData } from "@/lib/astronomy"
import { geocodeCity } from "@/lib/geocoding"
import type { SkyData } from "@/lib/types"

// --- Constants ---

const POSTER_WIDTH  = 900
const POSTER_HEIGHT = 1020

const FALLBACK_SKY_DATA: SkyData = {
  stars: [],
  lines: [],
  moonPhase: "Lua Crescente",
  brightestPlanet: "Vênus",
  season: "Verão",
  dominantConstellation: "Órion",
}

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

// ---

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.includes("/")
    ? dateStr.split("/").reverse()
    : dateStr.split("-")

  return `${parseInt(day, 10)} de ${MONTH_NAMES[parseInt(month, 10) - 1]} de ${year}`
}

function buildPosterCanvas(
  sourceCanvas: HTMLCanvasElement,
  name1: string,
  name2: string,
  formattedDate: string,
): HTMLCanvasElement {
  const poster = document.createElement("canvas")
  poster.width  = POSTER_WIDTH
  poster.height = POSTER_HEIGHT

  const ctx = poster.getContext("2d")!
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

  ctx.drawImage(sourceCanvas, 0, 0, POSTER_WIDTH, POSTER_WIDTH)

  ctx.textAlign = "center"

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font = `italic 42px 'Playfair Display', Georgia, serif`
  ctx.fillText(`${name1} & ${name2}`, POSTER_WIDTH / 2, POSTER_WIDTH + 52)

  ctx.fillStyle = "rgba(196, 181, 253, 0.8)"
  ctx.font = `20px 'Playfair Display', Georgia, serif`
  ctx.fillText(formattedDate, POSTER_WIDTH / 2, POSTER_WIDTH + 92)

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
  ctx.font = `italic 16px Georgia, serif`
  ctx.fillText("Naquela noite, o universo já sabia.", POSTER_WIDTH / 2, POSTER_WIDTH + 126)

  return poster
}

// ---

function ResultContent() {
  const searchParams   = useSearchParams()
  const mapCanvasRef   = useRef<HTMLCanvasElement | null>(null)
  const [downloading, setDownloading] = useState(false)

  const date  = searchParams.get("date")  ?? "2021-02-14"
  const city  = searchParams.get("city")  ?? "São Paulo"
  const name1 = searchParams.get("name1") ?? "Ana"
  const name2 = searchParams.get("name2") ?? "Lucas"
  const email = searchParams.get("email") ?? ""

  const formattedDate = formatDate(date)
  const coords = useMemo(() => geocodeCity(city), [city])

  const skyData = useMemo<SkyData>(() => {
    try {
      return computeSkyData(date, coords.lat, coords.lon)
    } catch {
      return FALLBACK_SKY_DATA
    }
  }, [date, coords])

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    mapCanvasRef.current = canvas
  }, [])

  const handleDownload = () => {
    const source = mapCanvasRef.current
    if (!source) return

    setDownloading(true)
    const poster = buildPosterCanvas(source, name1, name2, formattedDate)
    const link = document.createElement("a")
    link.download = `ceu-${name1.toLowerCase()}-${name2.toLowerCase()}.png`
    link.href = poster.toDataURL("image/png")
    link.click()
    setDownloading(false)
  }

  const handleShare = async () => {
    const text = `✨ O céu de ${coords.displayName} em ${formattedDate} — ${name1} & ${name2}`
    if (navigator.share) {
      await navigator.share({ title: "Céu do Nosso Dia", text })
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <StarBackground />

      <header className="relative z-10 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg">Céu do Nosso Dia</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">

          {/* Star map */}
          <div className="flex flex-col items-center text-center">
            <StarMapCanvas
              skyData={skyData}
              size={400}
              onReady={handleCanvasReady}
            />
            <h2 className="mt-8 font-serif text-3xl italic text-foreground">
              {name1} & {name2}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{formattedDate}</p>
            <p className="mt-4 font-serif italic text-muted-foreground text-sm max-w-xs">
              Naquela noite, o universo já sabia.
            </p>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-4">
              Seu mapa está pronto
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Aqui está o céu exato de {coords.displayName} na noite de {formattedDate}.
              Cada estrela foi posicionada com precisão astronômica.
            </p>

            <Card className="bg-card/50 border-border/50 mb-8">
              <CardContent className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Constelação visível
                  </p>
                  <p className="text-foreground font-medium">{skyData.dominantConstellation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Fase da lua
                  </p>
                  <p className="text-foreground font-medium">{skyData.moonPhase}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Estrela mais brilhante
                  </p>
                  <p className="text-foreground font-medium">{skyData.brightestPlanet}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Estação
                  </p>
                  <p className="text-foreground font-medium">{skyData.season}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 mb-4">
              <Button size="lg" className="w-full gap-2" onClick={handleDownload} disabled={downloading}>
                <Download className="h-4 w-4" />
                {downloading ? "Gerando..." : "Baixar pôster (PNG)"}
              </Button>
              <Button size="lg" variant="outline" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>

            {email && (
              <p className="text-sm text-muted-foreground text-center mb-8">
                Também enviamos para {email}
              </p>
            )}

            <Separator className="mb-8 bg-border/50" />

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

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Calculando seu céu...</div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
