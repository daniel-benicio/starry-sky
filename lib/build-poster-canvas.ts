"use client"

/**
 * Browser-only utility — gera o canvas do pôster para download/share.
 *
 * Recebe o canvas do mapa estelar já renderizado e monta a imagem
 * final com os textos, aplicando as opções de customização do usuário.
 */

import { getFontOption, DEFAULT_CUSTOMIZATION, type PosterCustomization } from "@/lib/poster-customization"
import { getFirstAndLastName } from "@/lib/formatters"

const POSTER_WIDTH  = 900
const POSTER_HEIGHT = 1020

/** Garante que a fonte solicitada esteja carregada antes de usá-la no canvas. */
async function ensureFontLoaded(style: string, size: number, family: string): Promise<void> {
  // Extrai só o nome principal da família para o document.fonts.load()
  const primaryFamily = family.split(",")[0].replace(/['"]/g, "").trim()
  try {
    await document.fonts.load(`${style} ${size}px "${primaryFamily}"`)
  } catch {
    // Se falhar, segue com o fallback — melhor exibir algo do que travar
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

  // Garante que as fontes necessárias estejam carregadas
  await Promise.all([
    document.fonts.ready,
    ensureFontLoaded(font.style, 42, font.fontFamily),
    ensureFontLoaded("normal",   20, font.fontFamily),
  ])

  const poster = document.createElement("canvas")
  poster.width  = POSTER_WIDTH
  poster.height = POSTER_HEIGHT

  const ctx = poster.getContext("2d")!

  // Fundo
  ctx.fillStyle = "#0a0a1a"
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

  // Mapa estelar (já renderizado no sourceCanvas)
  ctx.drawImage(sourceCanvas, 0, 0, POSTER_WIDTH, POSTER_WIDTH)

  ctx.textAlign = "center"

  // Nomes (fonte e estilo escolhidos pelo usuário)
  const displayName1 = getFirstAndLastName(name1)
  const displayName2 = getFirstAndLastName(name2)

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font      = `${font.style} 42px ${font.fontFamily}`
  ctx.fillText(`${displayName1} & ${displayName2}`, POSTER_WIDTH / 2, POSTER_WIDTH + 52)

  // Data (mesma família, sem italic)
  ctx.fillStyle = "rgba(196, 181, 253, 0.8)"
  ctx.font      = `normal 20px ${font.fontFamily}`
  ctx.fillText(formattedDate, POSTER_WIDTH / 2, POSTER_WIDTH + 92)

  // Frase personalizada
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
  ctx.font      = `italic 15px Georgia, serif`
  ctx.fillText(customization.quote, POSTER_WIDTH / 2, POSTER_WIDTH + 126)

  return poster
}
