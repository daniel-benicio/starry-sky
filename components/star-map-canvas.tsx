"use client"

import { useEffect, useRef, useCallback } from "react"
import type { SkyData, StarPoint, SkyLine } from "@/lib/types"

// --- Constants ---
const BG_SOLID        = "#04060f"
const LINE_COLOR      = "rgba(167, 139, 250, 0.75)"
const BORDER_MAIN     = "rgba(167, 139, 250, 0.55)"
const BORDER_INNER    = "rgba(167, 139, 250, 0.18)"
const TICK_MAJOR      = "rgba(167, 139, 250, 0.70)"
const TICK_MINOR      = "rgba(167, 139, 250, 0.28)"
const COMPASS_COLOR   = "rgba(255, 255, 255, 0.65)"

const STAR_MAG_MIN      = -1.5
const STAR_MAG_MAX      =  5.5
const STAR_RADIUS_BASE  =  3.5
const STAR_RADIUS_MIN   =  0.4
const STAR_RADIUS_SCALE =  0.55
const STAR_GLOW_MIN     =  1.5
const STAR_GLOW_FACTOR  =  5.0

const TICK_MAJOR_COUNT = 12
const TICK_MINOR_COUNT = 60
const COMPASS_OFFSET   = 22

// ---

interface StarMapCanvasProps {
  skyData: SkyData
  size?: number
  onReady?: (canvas: HTMLCanvasElement) => void
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function starRadius(mag: number): number {
  return Math.max(STAR_RADIUS_MIN, STAR_RADIUS_BASE - clamp(mag, STAR_MAG_MIN, STAR_MAG_MAX) * STAR_RADIUS_SCALE)
}

function starOpacity(mag: number): number {
  return clamp(1 - mag * 0.17, 0.05, 1)
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  size: number,
) {
  ctx.fillStyle = BG_SOLID
  ctx.fillRect(0, 0, size, size)

  const vignette = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius)
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)")
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.28)")
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, size, size)
}

function drawBackgroundStarfield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) {
  let seed = 0x9e3779b9
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 0) / 0x100000000
  }

  for (let i = 0; i < 55; i++) {
    const angle = rand() * Math.PI * 2
    const dist  = Math.sqrt(rand()) * (radius - 4)
    const x = cx + Math.cos(angle) * dist
    const y = cy + Math.sin(angle) * dist
    ctx.beginPath()
    ctx.arc(x, y, rand() * 0.35 + 0.08, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${(rand() * 0.10 + 0.04).toFixed(2)})`
    ctx.fill()
  }
}

function drawConstellationLines(
  ctx: CanvasRenderingContext2D,
  lines: SkyLine[],
  cx: number,
  cy: number,
  mapRadius: number,
) {
  ctx.strokeStyle = LINE_COLOR
  ctx.lineWidth = 0.6
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  for (const { x1, y1, x2, y2 } of lines) {
    ctx.beginPath()
    ctx.moveTo(cx + x1 * mapRadius, cy + y1 * mapRadius)
    ctx.lineTo(cx + x2 * mapRadius, cy + y2 * mapRadius)
    ctx.stroke()
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  star: StarPoint,
  cx: number,
  cy: number,
  mapRadius: number,
) {
  const x = cx + star.x * mapRadius
  const y = cy + star.y * mapRadius
  const r = starRadius(star.magnitude)
  const opacity = starOpacity(star.magnitude)

  if (r > STAR_GLOW_MIN) {
    const glowR = r * STAR_GLOW_FACTOR
    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR)
    glow.addColorStop(0,    `rgba(255,255,255,${(opacity * 0.6).toFixed(2)})`)
    glow.addColorStop(0.25, `rgba(255,255,255,${(opacity * 0.12).toFixed(2)})`)
    glow.addColorStop(1,    "rgba(255,255,255,0)")
    ctx.beginPath()
    ctx.arc(x, y, glowR, 0, Math.PI * 2)
    ctx.fillStyle = glow
    ctx.fill()
  }

  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255,255,255,${opacity})`
  ctx.fill()
}

function drawBorder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = BORDER_MAIN
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, radius - 7, 0, Math.PI * 2)
  ctx.strokeStyle = BORDER_INNER
  ctx.lineWidth = 0.6
  ctx.stroke()
}

function drawTicks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.strokeStyle = TICK_MINOR
  ctx.lineWidth = 0.6
  for (let i = 0; i < TICK_MINOR_COUNT; i++) {
    if (i % 5 === 0) continue
    const angle = (i / TICK_MINOR_COUNT) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * (radius - 4), cy + Math.sin(angle) * (radius - 4))
    ctx.lineTo(cx + Math.cos(angle) * radius,       cy + Math.sin(angle) * radius)
    ctx.stroke()
  }

  ctx.strokeStyle = TICK_MAJOR
  ctx.lineWidth = 1.5
  for (let i = 0; i < TICK_MAJOR_COUNT; i++) {
    const angle = (i / TICK_MAJOR_COUNT) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * (radius - 10), cy + Math.sin(angle) * (radius - 10))
    ctx.lineTo(cx + Math.cos(angle) * radius,        cy + Math.sin(angle) * radius)
    ctx.stroke()
  }
}

function drawCompassLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.font = "12px 'Playfair Display', Georgia, serif"
  ctx.fillStyle = COMPASS_COLOR
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  const d = radius + COMPASS_OFFSET
  ctx.fillText("N", cx, cy - d)
  ctx.fillText("S", cx, cy + d)
  ctx.fillText("L", cx + d, cy)
  ctx.fillText("O", cx - d, cy)
}

function renderSkyMap(
  ctx: CanvasRenderingContext2D,
  size: number,
  skyData: SkyData,
) {
  const cx        = size / 2
  const cy        = size / 2
  const radius    = size / 2 - 32
  const clipR     = radius - 8
  const mapRadius = radius - 14

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, clipR, 0, Math.PI * 2)
  ctx.clip()

  drawBackground(ctx, cx, cy, clipR, size)
  drawBackgroundStarfield(ctx, cx, cy, clipR)
  drawConstellationLines(ctx, skyData.lines, cx, cy, mapRadius)

  // Dimmer stars underneath, bright on top
  const sorted = [...skyData.stars].sort((a, b) => b.magnitude - a.magnitude)
  for (const star of sorted) drawStar(ctx, star, cx, cy, mapRadius)

  ctx.restore()

  drawBorder(ctx, cx, cy, radius)
  drawTicks(ctx, cx, cy, radius)
  drawCompassLabels(ctx, cx, cy, radius)
}

export function StarMapCanvas({ skyData, size = 500, onReady }: StarMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width  = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    renderSkyMap(ctx, size, skyData)
    onReady?.(canvas)
  }, [skyData, size, onReady])

  useEffect(() => { draw() }, [draw])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-full"
    />
  )
}
