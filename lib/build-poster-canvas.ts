"use client"

/**
 * Browser-only utility — gera o canvas do pôster para download/share.
 *
 * Recebe o canvas do mapa estelar já renderizado e monta a imagem
 * final com os textos, aplicando as opções de customização do usuário.
 */

import { getFontOption, DEFAULT_CUSTOMIZATION, type PosterCustomization } from "@/lib/poster-customization"
import { getFirstAndLastName } from "@/lib/formatters"

// Dimensões do pôster em pixels físicos (independente de DPR).
// Proporção 3:4 → espaço confortável para mapa (900px) + área de texto (300px).
const POSTER_W = 900
const POSTER_H = 1200

// Posições Y do bloco de texto (relativas ao fundo do mapa)
const MAP_BOTTOM  = POSTER_W          // o mapa ocupa POSTER_W × POSTER_W
const NAMES_Y     = MAP_BOTTOM + 78   // 42px font — linha base dos nomes
const DATE_Y      = MAP_BOTTOM + 135  // 20px font — data
const SEPARATOR_Y = MAP_BOTTOM + 168  // linha decorativa
const QUOTE_Y     = MAP_BOTTOM + 196  // 15px font — frase

/** Garante que a fonte está carregada antes de usá-la no canvas. */
async function ensureFontLoaded(style: string, size: number, family: string): Promise<void> {
  const primaryFamily = family.split(",")[0].replace(/['"]/g, "").trim()
  try {
    await document.fonts.load(`${style} ${size}px "${primaryFamily}"`)
  } catch {
    // Segue com fallback — melhor exibir algo do que travar
  }
}

export async function buildPosterCanvas(
  sourceCanvas:  HTMLCanvasElement,
  name1:         string,
  name2:         string,
  formattedDate: string,
  customization: PosterCustomization = DEFAULT_CUSTOMIZATION,
): Promise<HTMLCanvasElement> {
  const font = getFontOption(customization.fontId)

  await Promise.all([
    document.fonts.ready,
    ensureFontLoaded(font.style, 42, font.fontFamily),
    ensureFontLoaded("normal",   20, font.fontFamily),
  ])

  // ── Cria o canvas do pôster ────────────────────────────────────────────────
  const poster = document.createElement("canvas")
  poster.width  = POSTER_W
  poster.height = POSTER_H

  const ctx = poster.getContext("2d")!
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  // ── Mapa estelar ──────────────────────────────────────────────────────────
  // O StarMapCanvas usa devicePixelRatio: canvas.width = cssSize * dpr.
  // drawImage precisa dos 4 parâmetros de source para ler o canvas completo
  // e dos 4 de destino para colocá-lo na área correta do pôster.
  ctx.drawImage(
    sourceCanvas,
    0, 0, sourceCanvas.width, sourceCanvas.height,  // source: canvas inteiro (físico)
    0, 0, POSTER_W, POSTER_W,                        // dest: quadrado no topo do pôster
  )

  ctx.textAlign    = "center"
  ctx.textBaseline = "alphabetic"

  // ── Nomes ──────────────────────────────────────────────────────────────────
  const displayName1 = getFirstAndLastName(name1)
  const displayName2 = getFirstAndLastName(name2)

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)"
  ctx.font      = `${font.style} 42px ${font.fontFamily}`
  ctx.fillText(`${displayName1} & ${displayName2}`, POSTER_W / 2, NAMES_Y)

  // ── Data ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(196, 181, 253, 0.80)"
  ctx.font      = `normal 20px ${font.fontFamily}`
  ctx.fillText(formattedDate, POSTER_W / 2, DATE_Y)

  // ── Linha separadora ───────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(167, 139, 250, 0.20)"
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(POSTER_W * 0.30, SEPARATOR_Y)
  ctx.lineTo(POSTER_W * 0.70, SEPARATOR_Y)
  ctx.stroke()

  // ── Frase personalizada ────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255, 255, 255, 0.38)"
  ctx.font      = `italic 17px Georgia, serif`
  ctx.fillText(customization.quote, POSTER_W / 2, QUOTE_Y)

  return poster
}
