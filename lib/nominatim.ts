/**
 * Nominatim (OpenStreetMap) geocoding — server-side only.
 *
 * Chamado uma única vez por compra em /api/generate-result.
 * Limite: 1 req/s — muito acima do que um SaaS de casais atinge.
 * Custo: zero, sem API key.
 *
 * Política de uso:
 *   - User-Agent identificando o app (obrigatório)
 *   - Não chamar em loop ou em paralelo
 *   - https://operations.osmfoundation.org/policies/nominatim/
 */

import type { Coordinates } from "./types"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const USER_AGENT    = "starry-sky-app/1.0"
const TIMEOUT_MS    = 5_000

interface NominatimResult {
  lat:          string
  lon:          string
  display_name: string
}

/**
 * Resolve o nome de uma cidade em coordenadas geográficas.
 *
 * Retorna `null` se a cidade não for encontrada ou se a requisição falhar
 * (timeout, rede, parse) — o chamador deve ter um fallback.
 */
export async function nominatimGeocode(city: string): Promise<Coordinates | null> {
  const q = city.trim()
  if (!q) return null

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set("q",               q)
  url.searchParams.set("format",          "json")
  url.searchParams.set("limit",           "1")
  url.searchParams.set("accept-language", "pt-BR,pt")

  try {
    const controller = new AbortController()
    const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal:  controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return null

    const results: NominatimResult[] = await res.json()
    const first = results[0]
    if (!first) return null

    return {
      lat:         parseFloat(first.lat),
      lon:         parseFloat(first.lon),
      displayName: shortDisplayName(first.display_name, q),
    }
  } catch {
    // Timeout, rede indisponível ou parse error — o chamador usa o fallback estático
    return null
  }
}

/**
 * Extrai o primeiro segmento do display_name verboso do Nominatim.
 *
 * "Campinas, Região Geográfica Imediata de Campinas, ..."
 *   → "Campinas"
 */
function shortDisplayName(nominatimName: string, fallback: string): string {
  const first = nominatimName.split(",")[0].trim()
  return first || fallback
}
