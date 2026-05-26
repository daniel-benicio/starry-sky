import { describe, it, expect } from "vitest"
import { projectToMap } from "@/lib/astronomy/projection"

describe("projectToMap", () => {
  it("retorna null para estrela abaixo do horizonte", () => {
    expect(projectToMap(-5, 0)).toBeNull()
  })

  it("retorna null para altitude negativa qualquer", () => {
    expect(projectToMap(-90, 180)).toBeNull()
  })

  it("estrela no zênite retorna origem (0, 0)", () => {
    const result = projectToMap(90, 0)
    expect(result?.x).toBeCloseTo(0)
    expect(result?.y).toBeCloseTo(0)
  })

  it("estrela no horizonte tem zenithDistance = 1", () => {
    const result = projectToMap(0, 0)
    expect(result).not.toBeNull()
    const dist = Math.sqrt(result!.x ** 2 + result!.y ** 2)
    expect(dist).toBeCloseTo(1)
  })

  it("Norte (azimuth 0): y negativo, x próximo de zero", () => {
    const result = projectToMap(45, 0)
    expect(result?.y).toBeLessThan(0)
    expect(Math.abs(result?.x ?? 1)).toBeLessThan(0.01)
  })

  it("Sul (azimuth 180): y positivo, x próximo de zero", () => {
    const result = projectToMap(45, 180)
    expect(result?.y).toBeGreaterThan(0)
    expect(Math.abs(result?.x ?? 1)).toBeLessThan(0.01)
  })

  it("Leste (azimuth 90): x positivo, y próximo de zero", () => {
    const result = projectToMap(45, 90)
    expect(result?.x).toBeGreaterThan(0)
    expect(Math.abs(result?.y ?? 1)).toBeLessThan(0.01)
  })

  it("Oeste (azimuth 270): x negativo, y próximo de zero", () => {
    const result = projectToMap(45, 270)
    expect(result?.x).toBeLessThan(0)
    expect(Math.abs(result?.y ?? 1)).toBeLessThan(0.01)
  })

  it("coordenadas estão dentro do range [-1, 1]", () => {
    const cases = [
      [10, 0], [30, 45], [60, 135], [80, 270], [0, 90],
    ] as [number, number][]
    for (const [alt, az] of cases) {
      const result = projectToMap(alt, az)
      expect(result?.x).toBeGreaterThanOrEqual(-1)
      expect(result?.x).toBeLessThanOrEqual(1)
      expect(result?.y).toBeGreaterThanOrEqual(-1)
      expect(result?.y).toBeLessThanOrEqual(1)
    }
  })

  it("altitude 0 não retorna null (horizonte é visível)", () => {
    expect(projectToMap(0, 90)).not.toBeNull()
  })
})
