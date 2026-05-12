"use client"

import { useEffect, useRef } from "react"

interface StarMapPreviewProps {
  date?: string
  names?: string
}

export function StarMapPreview({ date, names }: StarMapPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = size / 2 - 20

    // Clear canvas
    ctx.fillStyle = "#0a0a1a"
    ctx.fillRect(0, 0, size, size)

    // Draw outer circle
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(167, 139, 250, 0.3)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Generate seed from date
    const seed = date 
      ? date.split("-").reduce((acc, val) => acc + parseInt(val), 0) 
      : 42

    // Seeded random function
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000
      return x - Math.floor(x)
    }

    // Draw stars
    const numStars = 150
    for (let i = 0; i < numStars; i++) {
      const angle = seededRandom(seed + i * 1.1) * Math.PI * 2
      const dist = seededRandom(seed + i * 2.2) * radius * 0.95
      const x = center + Math.cos(angle) * dist
      const y = center + Math.sin(angle) * dist
      const starSize = seededRandom(seed + i * 3.3) * 2 + 0.5
      const brightness = seededRandom(seed + i * 4.4) * 0.6 + 0.4

      ctx.beginPath()
      ctx.arc(x, y, starSize, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
      ctx.fill()
    }

    // Draw constellation lines
    const constellationPoints: [number, number][] = []
    for (let i = 0; i < 7; i++) {
      const angle = seededRandom(seed + i * 5.5) * Math.PI * 2
      const dist = seededRandom(seed + i * 6.6) * radius * 0.6 + radius * 0.1
      constellationPoints.push([
        center + Math.cos(angle) * dist,
        center + Math.sin(angle) * dist
      ])
    }

    ctx.beginPath()
    ctx.moveTo(constellationPoints[0][0], constellationPoints[0][1])
    for (let i = 1; i < constellationPoints.length; i++) {
      ctx.lineTo(constellationPoints[i][0], constellationPoints[i][1])
    }
    ctx.strokeStyle = "rgba(167, 139, 250, 0.4)"
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Draw brighter stars at constellation points
    constellationPoints.forEach(([x, y]) => {
      ctx.beginPath()
      ctx.arc(x, y, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(196, 181, 253, 0.9)"
      ctx.fill()
    })

  }, [date])

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative rounded-full border border-primary/20 p-4 bg-background/50 backdrop-blur-sm">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-full"
          aria-label="Prévia do mapa estelar"
        />
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="font-serif text-sm text-foreground/80 italic">
            {names || "Ana & Pedro"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { 
              day: "numeric", 
              month: "long", 
              year: "numeric" 
            }) : "14 de fevereiro de 2020"}
          </p>
        </div>
      </div>
    </div>
  )
}
