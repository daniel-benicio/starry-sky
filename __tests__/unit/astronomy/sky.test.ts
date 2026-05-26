import { describe, it, expect } from "vitest"
import { computeSkyData } from "@/lib/astronomy/sky"

describe("computeSkyData", () => {
  it("retorna o shape completo de SkyData", () => {
    const result = computeSkyData("2024-06-21", -23.5505, -46.6333)
    expect(result).toHaveProperty("stars")
    expect(result).toHaveProperty("lines")
    expect(result).toHaveProperty("moonPhase")
    expect(result).toHaveProperty("brightestPlanet")
    expect(result).toHaveProperty("season")
    expect(result).toHaveProperty("dominantConstellation")
  })

  it("stars e lines são arrays", () => {
    const result = computeSkyData("2024-06-21", -23.5505, -46.6333)
    expect(Array.isArray(result.stars)).toBe(true)
    expect(Array.isArray(result.lines)).toBe(true)
  })

  it("São Paulo em Junho tem season = Inverno", () => {
    const result = computeSkyData("2024-06-21", -23.5505, -46.6333)
    expect(result.season).toBe("Inverno")
  })

  it("São Paulo em Dezembro tem season = Verão", () => {
    const result = computeSkyData("2024-12-21", -23.5505, -46.6333)
    expect(result.season).toBe("Verão")
  })

  it("Londres em Junho tem season = Verão (hemisfério Norte)", () => {
    const result = computeSkyData("2024-06-21", 51.5074, -0.1278)
    expect(result.season).toBe("Verão")
  })

  it("moonPhase é uma string não-vazia", () => {
    const result = computeSkyData("2024-01-25", -23.5505, -46.6333)
    expect(result.moonPhase).toBeTruthy()
  })

  it("brightestPlanet é string ou null", () => {
    const result = computeSkyData("2024-06-21", -23.5505, -46.6333)
    expect(result.brightestPlanet === null || typeof result.brightestPlanet === "string").toBe(true)
  })

  it("céus de localizações diferentes produzem resultados diferentes", () => {
    const sp = computeSkyData("2024-06-21", -23.5505, -46.6333)
    const ny = computeSkyData("2024-06-21", 40.7128, -74.0060)
    expect(sp.season).not.toBe(ny.season) // Sul vs Norte
  })

  it("aceita data de 29 de fevereiro em ano bissexto", () => {
    expect(() => computeSkyData("2024-02-29", -23.5505, -46.6333)).not.toThrow()
  })

  it("dominantConstellation é uma string não-vazia", () => {
    const result = computeSkyData("2024-06-21", -23.5505, -46.6333)
    expect(result.dominantConstellation).toBeTruthy()
  })
})
