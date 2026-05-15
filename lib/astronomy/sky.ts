import * as Astronomy from "astronomy-engine"
import type { SkyData } from "../types"
import { describeMoonPhase } from "./moon"
import { getSeason } from "./season"
import { findBrightestVisiblePlanet } from "./planets"
import { computeVisibleStars } from "./stars"

// 01:00 UTC ≈ 22:00 local time in UTC-3 (Brazil)
const OBSERVATION_HOUR_UTC = 1

function parseObservationDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day, OBSERVATION_HOUR_UTC, 0, 0))
}

export function computeSkyData(
  dateStr: string,
  latitudeDeg: number,
  longitudeDeg: number,
): SkyData {
  const date = parseObservationDate(dateStr)
  const observer = new Astronomy.Observer(latitudeDeg, longitudeDeg, 0)

  const { stars, lines, dominantConstellation } = computeVisibleStars(date, observer)
  const month = date.getUTCMonth() + 1

  return {
    stars,
    lines,
    moonPhase: describeMoonPhase(date),
    brightestPlanet: findBrightestVisiblePlanet(date, observer),
    season: getSeason(month, latitudeDeg),
    dominantConstellation,
  }
}
