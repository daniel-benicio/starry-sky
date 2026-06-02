"use client"

import { useRef, useCallback, useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { Download, Loader2, Mail, Share2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toPng, toBlob } from "html-to-image"
import { StarMapCanvas } from "@/components/star-map-canvas"
import { StarBackground } from "@/components/star-background"
import { PosterCustomizer } from "@/components/poster-customizer"
import { PosterHTML } from "@/components/poster-html"
import { computeSkyData } from "@/lib/astronomy"
import { geocodeCity } from "@/lib/geocoding"
import type { PosterSkyInfo } from "@/lib/build-poster-canvas"
import { usePosterCustomization } from "@/hooks/use-poster-customization"
import { getFontOption } from "@/lib/poster-customization"
import type { SkyData, Coordinates } from "@/lib/types"
import type { ResultTokenData } from "@/lib/result-token"
import { formatDate, getFirstAndLastName } from "@/lib/formatters"

// ─── Constants ────────────────────────────────────────────────────────────────

const SAO_PAULO: Coordinates = { lat: -23.5505, lon: -46.6333, displayName: "São Paulo" }

const FALLBACK_SKY_DATA: SkyData = {
  stars: [],
  lines: [],
  moonPhase: "Lua Crescente",
  brightestPlanet: "Vênus",
  season: "Verão",
  dominantConstellation: "Órion",
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResultContent({ date, city, name1, name2, email, lat, lon }: ResultTokenData) {
  const posterRef        = useRef<HTMLDivElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading]       = useState(false)
  const [canvasSize, setCanvasSize]         = useState(400)
  const [skyData, setSkyData]               = useState<SkyData | null>(null)
  const [starMapDataUrl, setStarMapDataUrl] = useState("")
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailTo, setEmailTo]               = useState(email)
  const [sendingEmail, setSendingEmail]     = useState(false)
  const [emailSent, setEmailSent]           = useState(false)
  const [emailError, setEmailError]         = useState("")

  // ── Customização do pôster ─────────────────────────────────────────────────
  const { customization, setFont, setQuote, resetQuote } = usePosterCustomization()
  const activeFont = getFontOption(customization.fontId)

  // ── Coordenadas ────────────────────────────────────────────────────────────
  // Prioridade: lat/lon resolvidos server-side via Nominatim (presentes no token)
  // → fallback: tabela estática local → fallback final: São Paulo
  //
  // IMPORTANTE: tokenCoords DEVE ser memoizado. Criar um literal de objeto
  // inline ({ lat, lon, ... }) a cada render gera uma nova referência mesmo
  // com os mesmos valores, o que faz o useEffect de skyData rodar em loop
  // infinito (coords "muda" → setSkyData → re-render → nova referência → ...).
  const formattedDate = formatDate(date)
  const tokenCoords   = useMemo(
    () => (lat != null && lon != null)
      ? { lat, lon, displayName: city || "sua cidade" } satisfies Coordinates
      : null,
    [lat, lon, city],
  )
  const staticCoords  = useMemo(() => geocodeCity(city), [city])
  const coords        = useMemo(
    () => tokenCoords ?? staticCoords ?? SAO_PAULO,
    [tokenCoords, staticCoords],
  )
  const cityNotFound  = !tokenCoords && !staticCoords

  // Primeiro + último nome para evitar overflow na imagem
  const displayName1 = getFirstAndLastName(name1)
  const displayName2 = getFirstAndLastName(name2)

  // ── Sky data ───────────────────────────────────────────────────────────────
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

  // ── Canvas resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasWrapperRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setCanvasSize(Math.min(Math.floor(entry.contentRect.width), 400))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleHighResCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setStarMapDataUrl(canvas.toDataURL("image/png"))
  }, [])

  // ── Informações astronômicas para o pôster ────────────────────────────────
  const posterSkyInfo: PosterSkyInfo | undefined = skyData
    ? {
        dominantConstellation: skyData.dominantConstellation,
        moonPhase:             skyData.moonPhase,
        brightestPlanet:       skyData.brightestPlanet ?? "Nenhum visível",
        season:                skyData.season,
      }
    : undefined

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    const posterEl = posterRef.current?.firstElementChild as HTMLElement | null
    if (!posterEl || !starMapDataUrl || !skyData) return
    setDownloading(true)
    try {
      await document.fonts.ready
      const dataUrl = await toPng(posterEl, { pixelRatio: 2.5 })
      const link    = document.createElement("a")
      link.download = `ceu-${displayName1.toLowerCase().replace(/\s/g, "-")}-${displayName2.toLowerCase().replace(/\s/g, "-")}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    const posterEl  = posterRef.current?.firstElementChild as HTMLElement | null
    const shareText = `✨ O céu de ${coords.displayName} em ${formattedDate} — ${displayName1} & ${displayName2}`

    if (posterEl && navigator.share && typeof navigator.canShare === "function") {
      try {
        await document.fonts.ready
        const blob = await toBlob(posterEl, { pixelRatio: 2.5 })
        if (blob) {
          const file = new File([blob], `ceu-${displayName1}-${displayName2}.png`, { type: "image/png" })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "Céu do Nosso Dia", files: [file] })
            return
          }
        }
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

  const handleSendEmail = async () => {
    const posterEl = posterRef.current?.firstElementChild as HTMLElement | null
    if (!posterEl || !starMapDataUrl || !skyData) return

    setSendingEmail(true)
    setEmailError("")
    setEmailSent(false)

    try {
      await document.fonts.ready
      const posterDataUrl = await toPng(posterEl, { pixelRatio: 2.5 })

      const res = await fetch("/api/send-poster", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:         emailTo,
          name1:         displayName1,
          name2:         displayName2,
          formattedDate,
          city:          coords.displayName,
          posterDataUrl,
        }),
      })

      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}))
        throw new Error(message ?? "Erro ao enviar e-mail.")
      }

      setEmailSent(true)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Erro ao enviar e-mail.")
    } finally {
      setSendingEmail(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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

          {/* ── Coluna esquerda: mapa + preview + customização ──────────── */}
          <div className="flex flex-col items-center text-center min-w-0">

            <div ref={canvasWrapperRef} className="w-full max-w-[400px]">
              {skyData ? (
                <StarMapCanvas skyData={skyData} size={canvasSize} />
              ) : (
                <div
                  className="rounded-full bg-muted/30 animate-pulse"
                  style={{ width: canvasSize, height: canvasSize }}
                />
              )}
            </div>

            {/*
              Preview do texto do pôster — atualiza em tempo real conforme
              o usuário escolhe fonte e frase.
            */}
            <h2
              className="mt-6 text-2xl sm:text-3xl text-foreground transition-all duration-300"
              style={{
                fontFamily: activeFont.fontFamily,
                fontStyle:  activeFont.style,
              }}
            >
              {displayName1} & {displayName2}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">{formattedDate}</p>

            <p
              className="mt-3 text-base text-muted-foreground/80 max-w-xs transition-all duration-300 min-h-[1.75rem]"
              style={{ fontFamily: activeFont.fontFamily, fontStyle: "italic" }}
            >
              {customization.quote}
            </p>

            {/* Painel de customização — fica abaixo do preview */}
            <div className="mt-6 w-full max-w-[400px] text-left">
              <PosterCustomizer
                customization={customization}
                onFontChange={setFont}
                onQuoteChange={setQuote}
                onQuoteReset={resetQuote}
              />
            </div>

          </div>

          {/* ── Coluna direita: detalhes + customização + ações ─────────── */}
          <div className="flex flex-col min-w-0">

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
              Seu mapa está pronto
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Aqui está o céu exato de {coords.displayName} na noite de {formattedDate}.
              Cada estrela foi posicionada com precisão astronômica.
            </p>

            {email && (
              <p className="text-xs text-muted-foreground/70 mb-4">
                Enviado para{" "}
                <span className="text-muted-foreground">{email}</span>
              </p>
            )}

            {cityNotFound && (
              <p className="text-xs text-amber-400/80 mb-4">
                Cidade não reconhecida — exibindo mapa de São Paulo.
              </p>
            )}

            {/* Dados astronômicos */}
            <Card className="bg-card/50 border-border/50 mb-5">
              <CardContent className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Constelação visível
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {skyData?.dominantConstellation ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Fase da lua
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {skyData?.moonPhase ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Planeta mais brilhante
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {skyData?.brightestPlanet ?? "Nenhum visível"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Estação
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {skyData?.season ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex flex-col gap-3 mb-4">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleDownload}
                disabled={downloading || !skyData}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloading ? "Gerando…" : "Baixar pôster (PNG)"}
              </Button>

              {/* Enviar por e-mail */}
              <Dialog
                open={emailDialogOpen}
                onOpenChange={(open) => {
                  setEmailDialogOpen(open)
                  if (!open) { setEmailSent(false); setEmailError("") }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={!starMapDataUrl || !skyData}
                  >
                    <Mail className="h-4 w-4" />
                    Enviar por e-mail
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Enviar pôster por e-mail</DialogTitle>
                    <DialogDescription>
                      O pôster com a fonte e frase que você escolheu será anexado ao e-mail.
                    </DialogDescription>
                  </DialogHeader>

                  {emailSent ? (
                    <p className="text-sm text-center py-4 text-primary">
                      ✦ E-mail enviado com sucesso!
                    </p>
                  ) : (
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="emailTo">Endereço de e-mail</Label>
                        <Input
                          id="emailTo"
                          type="email"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          placeholder="seu@email.com"
                        />
                      </div>
                      {emailError && (
                        <p className="text-sm text-destructive">{emailError}</p>
                      )}
                    </div>
                  )}

                  {!emailSent && (
                    <DialogFooter>
                      <Button
                        onClick={handleSendEmail}
                        disabled={sendingEmail || !emailTo}
                        className="w-full gap-2"
                      >
                        {sendingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        {sendingEmail ? "Enviando…" : "Enviar"}
                      </Button>
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>

              <Button size="lg" variant="outline" className="w-full gap-2 lg:hidden" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>

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
      {/* ── Off-screen high-res canvas para geração do pôster ─────────── */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }}>
        {skyData && (
          <StarMapCanvas skyData={skyData} size={780} onReady={handleHighResCanvasReady} />
        )}
      </div>

      {/* ── Pôster HTML oculto — capturado pelo html-to-image ──────────── */}
      <div ref={posterRef} style={{ position: "fixed", left: "-9999px", top: 0, pointerEvents: "none" }}>
        {starMapDataUrl && (
          <PosterHTML
            starMapDataUrl={starMapDataUrl}
            displayName1={displayName1}
            displayName2={displayName2}
            formattedDate={formattedDate}
            customization={customization}
            skyInfo={posterSkyInfo}
          />
        )}
      </div>
    </div>
  )
}
