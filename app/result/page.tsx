"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Loader2, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StarMapCanvas } from "@/components/star-map-canvas";
import { StarBackground } from "@/components/star-background";
import { generatePosterPng } from "@/lib/generate-poster";
import { formatDate } from "@/lib/formatters";

const ASTRONOMICAL_DATA = {
  constellation: "Órion",
  moonPhase: "Lua Crescente 34%",
  brightestStar: "Vênus",
  season: "Verão",
} as const;

function ResultContent() {
  const searchParams = useSearchParams();
  const posterFileRef = useRef<File | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [posterReady, setPosterReady] = useState(false);
  const [canvasSize, setCanvasSize] = useState(400);

  const date = searchParams.get("date") || "14/02/2021";
  const city = searchParams.get("city") || "São Paulo";
  const name1 = searchParams.get("name1") || "Ana";
  const name2 = searchParams.get("name2") || "Lucas";
  const email = searchParams.get("email") || "ana@email.com";

  // Track the canvas wrapper width so the canvas never overflows on small screens
  useEffect(() => {
    const el = canvasWrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCanvasSize(Math.min(Math.floor(entry.contentRect.width), 400));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    generatePosterPng({ date, name1, name2, city, ...ASTRONOMICAL_DATA }).then(async (dataUrl) => {
      const blob = await fetch(dataUrl).then((r) => r.blob());
      posterFileRef.current = new File([blob], `ceu-${name1}-${name2}.png`, { type: "image/png" });
      setPosterReady(true);
    });
  }, [date, name1, name2, city]);

  function handleDownload() {
    const file = posterFileRef.current;
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function handleShare() {
    const file = posterFileRef.current;
    if (!file || !navigator.share) return;
    navigator.share({ files: [file], title: "Céu do Nosso Dia" });
  }

  const formattedDate = formatDate(date);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <StarBackground />

      <header className="relative z-10 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg">Céu do Nosso Dia</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto">

          {/* Left Column - Star Map */}
          <div className="flex flex-col items-center text-center min-w-0">
            <div ref={canvasWrapperRef} className="w-full max-w-[400px]">
              <StarMapCanvas date={date} name1={name1} name2={name2} size={canvasSize} />
            </div>

            <h2 className="mt-6 font-serif text-2xl sm:text-3xl italic text-foreground">
              {name1} & {name2}
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
              Aqui está o céu exato de {city} na noite de {formattedDate}. Cada
              estrela foi posicionada com precisão astronômica.
            </p>

            <Card className="bg-card/50 border-border/50 mb-6">
              <CardContent className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Constelação visível
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {ASTRONOMICAL_DATA.constellation}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Fase da lua
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {ASTRONOMICAL_DATA.moonPhase}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Estrela mais brilhante
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {ASTRONOMICAL_DATA.brightestStar}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Estação
                  </p>
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {ASTRONOMICAL_DATA.season}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 mb-4">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleDownload}
                disabled={!posterReady}
              >
                {!posterReady ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {!posterReady ? "Preparando pôster…" : "Baixar pôster (PNG)"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 lg:hidden"
                onClick={handleShare}
                disabled={!posterReady}
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center mb-6">
              Também enviamos para {email}
            </p>

            <Separator className="mb-6 bg-border/50" />

            <div className="text-center">
              <p className="text-muted-foreground mb-3">
                Gostou? Presenteie outra pessoa
              </p>
              <Button variant="ghost" asChild>
                <Link href="/">Criar novo mapa</Link>
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
