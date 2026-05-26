import { describe, it, expect } from "vitest"
import * as Astronomy from "astronomy-engine"
import { computeVisibleStars } from "@/lib/astronomy/stars"

const SAO_PAULO_OBSERVER = new Astronomy.Observer(-23.5505, -46.6333, 0)
const LONDON_OBSERVER = new Astronomy.Observer(51.5074, -0.1278, 0)

const DATE_SUMMER = new Date("2024-01-15T01:00:00Z")   // Verão BR
const DATE_WINTER = new Date("2024-07-15T01:00:00Z")   // Inverno BR

describe("computeVisibleStars", () => {
  it("retorna ao menos algumas estrelas visíveis para São Paulo no Verão", () => {
    const { stars } = computeVisibleStars(DATE_SUMMER, SAO_PAULO_OBSERVER)
    expect(stars.length).toBeGreaterThan(0)
  })

  it("retorna ao menos algumas estrelas visíveis para São Paulo no Inverno", () => {
    const { stars } = computeVisibleStars(DATE_WINTER, SAO_PAULO_OBSERVER)
    expect(stars.length).toBeGreaterThan(0)
  })

  it("todas as estrelas têm coordenadas dentro de [-1, 1]", () => {
    const { stars } = computeVisibleStars(DATE_SUMMER, SAO_PAULO_OBSERVER)
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(-1)
      expect(star.x).toBeLessThanOrEqual(1)
      expect(star.y).toBeGreaterThanOrEqual(-1)
      expect(star.y).toBeLessThanOrEqual(1)
    }
  })

  it("todas as estrelas têm magnitude numérica", () => {
    const { stars } = computeVisibleStars(DATE_SUMMER, SAO_PAULO_OBSERVER)
    for (const star of stars) {
      expect(typeof star.magnitude).toBe("number")
      expect(isNaN(star.magnitude)).toBe(false)
    }
  })

  it("todas as estrelas têm constelação definida", () => {
    const { stars } = computeVisibleStars(DATE_SUMMER, SAO_PAULO_OBSERVER)
    for (const star of stars) {
      expect(star.constellation).toBeTruthy()
    }
  })

  it("dominantConstellation é uma string não-vazia", () => {
    const { dominantConstellation } = computeVisibleStars(DATE_SUMMER, SAO_PAULO_OBSERVER)
    expect(dominantConstellation).toBeTruthy()
    expect(typeof dominantConstellation).toBe("string")
  })

  it("céu de Londres tem contagem de estrelas visíveis diferente de São Paulo", () => {
    const spResult = computeVisibleStars(DATE_SUMMER, SAO_PAULO_OBSERVER)
    const londonResult = computeVisibleStars(DATE_SUMMER, LONDON_OBSERVER)
    // Horizontes diferentes → número de estrelas visíveis acima do horizonte difere
    expect(spResult.stars.length).not.toBe(londonResult.stars.length)
  })

  it("linhas de constelação só conectam estrelas presentes no resultado", () => {
    const { stars, lines } = computeVisibleStars(DATE_SUMMER, SAO_PAULO_OBSERVER)
    for (const line of lines) {
      const starCoords = stars.map((s) => `${s.x.toFixed(6)},${s.y.toFixed(6)}`)
      const p1 = `${line.x1.toFixed(6)},${line.y1.toFixed(6)}`
      const p2 = `${line.x2.toFixed(6)},${line.y2.toFixed(6)}`
      expect(starCoords).toContain(p1)
      expect(starCoords).toContain(p2)
    }
  })
})
