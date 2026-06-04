import * as Astronomy from "astronomy-engine"
import { STARS, CONSTELLATION_LINES } from "../star-catalog"
import type { StarPoint, SkyLine } from "../types"
import { projectToMap } from "./projection"

// Render stars down to this magnitude (naked-eye limit with a small margin)
const MAX_RENDER_MAGNITUDE = 6.0

const CONSTELLATION_NAMES: Record<string, string> = {
  And: "Andrômeda",    Ant: "Antlia",         Aps: "Apus",
  Aql: "Águia",        Aqr: "Aquário",        Ara: "Ara",
  Ari: "Áries",        Aur: "Auriga",         Boo: "Boieiro",
  CMa: "Cão Maior",    CMi: "Cão Menor",      CVn: "Canes Venatici",
  Cap: "Capricórnio",  Car: "Quilha",         Cas: "Cassiopeia",
  Cen: "Centauro",     Cep: "Cefeu",          Cet: "Cetus",
  Col: "Pomba",        CrA: "Corona Austral", CrB: "Corona Boreal",
  Crt: "Taça",         Cru: "Cruzeiro do Sul",Crv: "Corvo",
  Cyg: "Cisne",        Del: "Golfinho",       Dor: "Dourado",
  Dra: "Dragão",       Eri: "Erídano",        For: "Fornalha",
  Gem: "Gêmeos",       Gru: "Grou",           Her: "Hércules",
  Hor: "Relógio",      Hya: "Hidra",          Ind: "Índio",
  Leo: "Leão",         Lep: "Lebre",          Lib: "Balança",
  Lup: "Lobo",         Lyn: "Lince",          Lyr: "Lira",
  Men: "Mesa",         Mic: "Microscópio",    Mon: "Unicórnio",
  Nor: "Esquadro",     Oct: "Oitante",        Oph: "Ofiúco",
  Ori: "Órion",        Pav: "Pavão",          Peg: "Pégaso",
  Per: "Perseu",       Phe: "Fênix",          Pic: "Pintor",
  PsA: "Peixe Austral",Psc: "Peixes",         Pup: "Popa",
  Pyx: "Bússola",      Ret: "Retículo",       Sco: "Escorpião",
  Sct: "Escudo",       Ser: "Serpente",       Sgr: "Sagitário",
  Tau: "Touro",        TrA: "Triângulo Austral", Tri: "Triângulo",
  UMa: "Ursa Maior",   UMi: "Ursa Menor",     Vel: "Vela",
  Vir: "Virgem",       Vol: "Voador",         Vul: "Raposa",
}

export interface VisibleSky {
  stars: StarPoint[]
  lines: SkyLine[]
  dominantConstellation: string
}

export function computeVisibleStars(
  date: Date,
  observer: Astronomy.Observer,
): VisibleSky {
  const visibleByHip: Record<number, StarPoint> = {}
  const stars: StarPoint[] = []

  for (const catalogStar of STARS) {
    // STARS is sorted brightest-first; once we exceed the limit we can stop
    if (catalogStar.mag > MAX_RENDER_MAGNITUDE) break

    try {
      const hz = Astronomy.Horizon(date, observer, catalogStar.ra, catalogStar.dec, "normal")
      const point = projectToMap(hz.altitude, hz.azimuth)
      if (!point) continue

      const star: StarPoint = {
        x: point.x,
        y: point.y,
        magnitude: catalogStar.mag,
        name: catalogStar.name,
        constellation: catalogStar.con,
      }
      stars.push(star)
      visibleByHip[catalogStar.hip] = star
    } catch {
      // Star not computable for this date — skip
    }
  }

  return {
    stars,
    lines: buildConstellationLines(visibleByHip),
    dominantConstellation: findDominantConstellation(stars),
  }
}

function buildConstellationLines(
  visibleByHip: Record<number, StarPoint>,
): SkyLine[] {
  const lines: SkyLine[] = []

  for (const pairs of Object.values(CONSTELLATION_LINES)) {
    for (const [hipA, hipB] of pairs) {
      const a = visibleByHip[hipA]
      const b = visibleByHip[hipB]
      if (a && b) lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })
    }
  }

  return lines
}

function findDominantConstellation(stars: StarPoint[]): string {
  const fluxByConstellation: Record<string, number> = {}

  for (const star of stars) {
    const flux = Math.pow(10, -0.4 * star.magnitude)
    fluxByConstellation[star.constellation] =
      (fluxByConstellation[star.constellation] ?? 0) + flux
  }

  const sorted = Object.entries(fluxByConstellation).sort(([, a], [, b]) => b - a)
  const [topAbbr] = sorted[0] ?? []
  return CONSTELLATION_NAMES[topAbbr] ?? "Órion"
}
