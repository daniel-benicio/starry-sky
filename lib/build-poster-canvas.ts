/**
 * @browser-only — requires DOM Canvas API; do not import in Server Components.
 *
 * Gera o canvas do pôster para download/share a partir do canvas do mapa estelar
 * já renderizado, aplicando as opções de customização do usuário.
 *
 * Nomes esperados já truncados pelo caller (primeiro + último nome).
 */

import { getFontOption, DEFAULT_CUSTOMIZATION, type PosterCustomization } from "@/lib/poster-customization"

// ─── Dimensões ─────────────────────────────────────────────────────────────────
// Proporção 3:4 → espaço para mapa (900px) + bloco de texto (240px) + grade (208px) + margens
const POSTER_W = 900
const POSTER_H = 1440

// ─── Posições Y do bloco de texto ──────────────────────────────────────────────
const MAP_BOTTOM  = POSTER_W          // o mapa ocupa POSTER_W × POSTER_W (900px)
const NAMES_Y     = MAP_BOTTOM + 78   // 42px font — linha base dos nomes
const DATE_Y      = MAP_BOTTOM + 135  // 20px font — data
const SEPARATOR_Y = MAP_BOTTOM + 168  // linha decorativa central
const QUOTE_Y     = MAP_BOTTOM + 210  // 17px font — frase personalizada

// ─── Grade de informações astronômicas ─────────────────────────────────────────
const GRID_DIVIDER_Y = MAP_BOTTOM + 252  // linha fina acima da grade
const GRID_TOP_Y     = MAP_BOTTOM + 276  // Y de referência para a primeira linha da grade
const GRID_ROW_H     = 100               // altura de cada linha (2 linhas = 200px)
const GRID_COL_W     = POSTER_W / 2      // largura de cada coluna (450px)

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface PosterSkyInfo {
  dominantConstellation: string
  moonPhase:             string
  brightestPlanet:       string
  season:                string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Garante que a fonte está carregada antes de usá-la no canvas. */
async function ensureFontLoaded(style: string, size: number, family: string): Promise<void> {
  const primaryFamily = family.split(",")[0].replace(/['"]/g, "").trim()
  try {
    await document.fonts.load(`${style} ${size}px "${primaryFamily}"`)
  } catch {
    // Segue com fallback — melhor exibir algo do que travar
  }
}

/** Desenha texto reduzindo o font-size até caber dentro de maxWidth. */
function fillTextFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFont: string,
  baseFontSize: number,
): void {
  let fontSize = baseFontSize
  ctx.font = baseFont.replace(/\d+px/, `${fontSize}px`)
  while (ctx.measureText(text).width > maxWidth && fontSize > 10) {
    fontSize -= 1
    ctx.font = baseFont.replace(/\d+px/, `${fontSize}px`)
  }
  ctx.fillText(text, x, y)
}

// ─── Builder ───────────────────────────────────────────────────────────────────

export async function buildPosterCanvas(
  sourceCanvas:  HTMLCanvasElement,
  name1:         string,
  name2:         string,
  formattedDate: string,
  customization: PosterCustomization = DEFAULT_CUSTOMIZATION,
  skyInfo?:      PosterSkyInfo,
): Promise<HTMLCanvasElement> {
  const font = getFontOption(customization.fontId)

  await Promise.all([
    document.fonts.ready,
    ensureFontLoaded(font.style,  42, font.fontFamily),
    ensureFontLoaded("normal",    20, font.fontFamily),
    ensureFontLoaded("italic",    17, font.fontFamily),
    ensureFontLoaded("normal",    13, '"Inter", system-ui, sans-serif'),
  ])

  // ── Cria o canvas do pôster ────────────────────────────────────────────────
  const poster = document.createElement("canvas")
  poster.width  = POSTER_W
  poster.height = POSTER_H

  const ctx = poster.getContext("2d")!
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  // ── Mapa estelar ──────────────────────────────────────────────────────────
  // StarMapCanvas usa devicePixelRatio: canvas.width = cssSize * dpr.
  // Lemos o canvas completo (source rect físico) e desenhamos no quadrado do topo.
  ctx.drawImage(
    sourceCanvas,
    0, 0, sourceCanvas.width, sourceCanvas.height,  // source: canvas inteiro (físico)
    0, 0, POSTER_W, POSTER_W,                        // dest: quadrado no topo do pôster
  )

  ctx.textAlign    = "center"
  ctx.textBaseline = "alphabetic"

  // ── Nomes ──────────────────────────────────────────────────────────────────
  // name1/name2 já chegam truncados pelo caller (primeiro + último nome)
  const namesText  = `${name1} & ${name2}`
  const namesFont  = `${font.style} 42px ${font.fontFamily}`
  ctx.fillStyle    = "rgba(255, 255, 255, 0.92)"
  fillTextFit(ctx, namesText, POSTER_W / 2, NAMES_Y, POSTER_W * 0.88, namesFont, 42)

  // ── Data ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(196, 181, 253, 0.80)"
  ctx.font      = `normal 20px ${font.fontFamily}`
  ctx.fillText(formattedDate, POSTER_W / 2, DATE_Y)

  // ── Linha separadora central ───────────────────────────────────────────────
  ctx.strokeStyle = "rgba(167, 139, 250, 0.20)"
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(POSTER_W * 0.30, SEPARATOR_Y)
  ctx.lineTo(POSTER_W * 0.70, SEPARATOR_Y)
  ctx.stroke()

  // ── Frase personalizada ────────────────────────────────────────────────────
  const quoteFont = `italic 17px ${font.fontFamily}`
  ctx.fillStyle   = "rgba(255, 255, 255, 0.38)"
  fillTextFit(ctx, customization.quote, POSTER_W / 2, QUOTE_Y, POSTER_W * 0.88, quoteFont, 17)

  // ── Grade de informações astronômicas ─────────────────────────────────────
  if (skyInfo) {
    // Linha fina divisória acima da grade
    ctx.strokeStyle = "rgba(167, 139, 250, 0.14)"
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(POSTER_W * 0.08, GRID_DIVIDER_Y)
    ctx.lineTo(POSTER_W * 0.92, GRID_DIVIDER_Y)
    ctx.stroke()

    const cells = [
      { label: "Constelação visível",    value: skyInfo.dominantConstellation },
      { label: "Fase da lua",            value: skyInfo.moonPhase             },
      { label: "Planeta mais brilhante", value: skyInfo.brightestPlanet       },
      { label: "Estação",                value: skyInfo.season                },
    ] as const

    cells.forEach((cell, i) => {
      const col   = i % 2
      const row   = Math.floor(i / 2)
      const cx    = col * GRID_COL_W + GRID_COL_W / 2  // centro X da coluna
      const baseY = GRID_TOP_Y + row * GRID_ROW_H       // topo da célula

      // Rótulo em maiúsculas pequenas
      ctx.textAlign = "center"
      ctx.fillStyle = "rgba(167, 139, 250, 0.55)"
      ctx.font      = `normal 12px "Inter", system-ui, sans-serif`
      ctx.fillText(cell.label.toUpperCase(), cx, baseY + 24)

      // Valor na fonte selecionada pelo usuário
      ctx.fillStyle = "rgba(255, 255, 255, 0.82)"
      fillTextFit(ctx, cell.value, cx, baseY + 58, GRID_COL_W * 0.88, `${font.style} 22px ${font.fontFamily}`, 22)
    })

    // Linha divisória vertical (centro)
    ctx.strokeStyle = "rgba(167, 139, 250, 0.10)"
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(POSTER_W / 2, GRID_TOP_Y - 8)
    ctx.lineTo(POSTER_W / 2, GRID_TOP_Y + GRID_ROW_H * 2 + 8)
    ctx.stroke()

    // Linha divisória horizontal (entre as duas linhas)
    ctx.beginPath()
    ctx.moveTo(POSTER_W * 0.08, GRID_TOP_Y + GRID_ROW_H)
    ctx.lineTo(POSTER_W * 0.92, GRID_TOP_Y + GRID_ROW_H)
    ctx.stroke()
  }

  return poster
}
