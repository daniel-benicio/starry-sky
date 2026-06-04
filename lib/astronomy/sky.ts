import * as Astronomy from "astronomy-engine"
import type { SkyData } from "../types"
import { describeMoonPhase } from "./moon"
import { getSeason } from "./season"
import { findBrightestVisiblePlanet } from "./planets"
import { computeVisibleStars } from "./stars"

// Horário local de observação: 22:00 — claramente noite, sem depender
// de calcular o crepúsculo astronômico para cada latitude.
const OBSERVATION_HOUR_LOCAL = 22

/**
 * Calcula o instante UTC correspondente a 22:00 no horário local
 * da cidade informada, usando o offset solar (longitude / 15).
 *
 * Por que offset solar em vez de timezone IANA?
 *   - Zero dependência de banco de dados de fusos horários (~4 MB).
 *   - Erro máximo: ~1 h em fronteiras políticas atípicas (China, Índia).
 *   - Para um produto de pôster, 15° de drift no mapa é imperceptível.
 *   - Para o Brasil inteiro (UTC-3, -4, -5) o acerto é exato.
 *
 * Exemplos:
 *   São Paulo  lon=-46.6° → offset=-3 → 22:00 BRT  = próximo dia 01:00 UTC  ✓
 *   Manaus     lon=-60.0° → offset=-4 → 22:00 AMT  = próximo dia 02:00 UTC  ✓
 *   Tóquio     lon=139.7° → offset=+9 → 22:00 JST  = mesmo dia  13:00 UTC  ✓
 *   Nova York  lon=-74.0° → offset=-5 → 22:00 EST  = próximo dia 03:00 UTC  ✓
 */
function observationDateFor(dateStr: string, longitudeDeg: number): Date {
  const [year, month, day] = dateStr.split("-").map(Number)

  // Offset em horas inteiras: 1 fuso a cada 15° de longitude
  const utcOffsetHours = Math.round(longitudeDeg / 15)

  // Meia-noite local do dia informado expressa em UTC:
  //   local 00:00 = UTC 00:00 − utcOffset
  const localMidnightUtcMs = Date.UTC(year, month - 1, day, -utcOffsetHours, 0, 0)

  // Adiciona as horas de observação para chegar em 22:00 local
  return new Date(localMidnightUtcMs + OBSERVATION_HOUR_LOCAL * 60 * 60 * 1000)
}

export function computeSkyData(
  dateStr:      string,
  latitudeDeg:  number,
  longitudeDeg: number,
): SkyData {
  const date     = observationDateFor(dateStr, longitudeDeg)
  const observer = new Astronomy.Observer(latitudeDeg, longitudeDeg, 0)

  const { stars, lines, dominantConstellation } = computeVisibleStars(date, observer)
  const month = date.getUTCMonth() + 1

  return {
    stars,
    lines,
    moonPhase:             describeMoonPhase(date),
    brightestPlanet:       findBrightestVisiblePlanet(date, observer),
    season:                getSeason(month, latitudeDeg),
    dominantConstellation,
  }
}
