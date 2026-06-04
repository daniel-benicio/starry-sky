"use client"

import { useEffect, useRef } from "react"

interface StarMapPreviewProps {
  date?: string
  names?: string
}

// Decorative static preview — does not compute real astronomy
export function StarMapPreview({ date, names }: StarMapPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = 300
    const center = size / 2
    const radius = size / 2 - 20

    ctx.fillStyle = "#0a0a1a"
    ctx.fillRect(0, 0, size, size)

    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.clip()

    const grad = ctx.createRadialGradient(center, center, 0, center, center, radius)
    grad.addColorStop(0, "rgba(20, 10, 50, 0.5)")
    grad.addColorStop(1, "rgba(5, 5, 20, 0.8)")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    // Deterministic decorative stars using golden ratio spiral
    const brightPoints: [number, number][] = []
    for (let i = 0; i < 160; i++) {
      const angle = i * 2.399963    // golden angle
      const dist = Math.sqrt(i / 160) * (radius - 15)
      const x = center + Math.cos(angle) * dist
      const y = center + Math.sin(angle) * dist
      const isBright = i % 11 === 0

      if (isBright) brightPoints.push([x, y])

      ctx.beginPath()
      ctx.arc(x, y, isBright ? 2.2 : 0.9, 0, Math.PI * 2)
      ctx.fillStyle = isBright
        ? "rgba(196, 181, 253, 0.95)"
        : `rgba(255, 255, 255, ${0.25 + (i % 5) * 0.08})`
      ctx.fill()
    }

    // Constellation lines between bright points
    ctx.strokeStyle = "rgba(167, 139, 250, 0.3)"
    ctx.lineWidth = 0.7
    for (let i = 0; i < brightPoints.length - 1; i++) {
      const [x1, y1] = brightPoints[i]
      const [x2, y2] = brightPoints[i + 1]
      const dist = Math.hypot(x2 - x1, y2 - y1)
      if (dist < 80) {
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }

    ctx.restore()

    // Border
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(167, 139, 250, 0.3)"
    ctx.lineWidth = 1
    ctx.stroke()
  }, [])   // only on mount — fully static

  return (
    <div className="relative w-full max-w-[300px]">
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative rounded-full border border-primary/20 p-4 bg-background/50 backdrop-blur-sm">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-full w-full h-auto"
          aria-label="Prévia do mapa estelar"
        />
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="font-serif text-sm text-foreground/80 italic">
            {names || "Ana & Pedro"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {date
              ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "14 de fevereiro de 2020"}
          </p>
        </div>
      </div>
    </div>
  )
}
