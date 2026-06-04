import * as Astronomy from "astronomy-engine"

interface PlanetEntry {
  body: Astronomy.Body
  name: string
}

const PLANETS: PlanetEntry[] = [
  { body: Astronomy.Body.Venus,   name: "Vênus" },
  { body: Astronomy.Body.Jupiter, name: "Júpiter" },
  { body: Astronomy.Body.Mars,    name: "Marte" },
  { body: Astronomy.Body.Saturn,  name: "Saturno" },
  { body: Astronomy.Body.Mercury, name: "Mercúrio" },
]

const MIN_VISIBLE_ALTITUDE_DEG = 5

export function findBrightestVisiblePlanet(
  date: Date,
  observer: Astronomy.Observer,
): string | null {
  let bestName: string | null = null
  let bestMagnitude = Infinity

  for (const { body, name } of PLANETS) {
    try {
      const equatorial = Astronomy.Equator(body, date, observer, true, true)
      const horizontal = Astronomy.Horizon(date, observer, equatorial.ra, equatorial.dec, "normal")

      if (horizontal.altitude < MIN_VISIBLE_ALTITUDE_DEG) continue

      const { mag } = Astronomy.Illumination(body, date)
      if (mag < bestMagnitude) {
        bestMagnitude = mag
        bestName = name
      }
    } catch {
      // Body not computable for this date — skip
    }
  }

  return bestName
}
