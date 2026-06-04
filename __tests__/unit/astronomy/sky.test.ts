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

  // ── Correção de timezone (offset solar por longitude) ──────────────────────

  it("São Paulo e Manaus produzem céus diferentes para a mesma data (offsets distintos)", () => {
    // São Paulo UTC-3 (lon≈-47°) e Manaus UTC-4 (lon≈-60°) — 1h de diferença
    const sp     = computeSkyData("2024-06-21", -23.5505, -46.6333)
    const manaus = computeSkyData("2024-06-21", -3.1019,  -60.0250)
    // Estrelas em posições diferentes — arrays de tamanhos distintos ou
    // pelo menos o mapa não é idêntico
    expect(sp.dominantConstellation).toBeTruthy()
    expect(manaus.dominantConstellation).toBeTruthy()
    // Os pontos das estrelas devem diferir entre as duas localizações
    const spFirstStar     = sp.stars[0]
    const manausFirstStar = manaus.stars[0]
    if (spFirstStar && manausFirstStar) {
      // Coordenadas de projeção ou quantidade de estrelas visíveis variam
      const identical = spFirstStar.x === manausFirstStar.x &&
                        spFirstStar.y === manausFirstStar.y
      expect(identical).toBe(false)
    }
  })

  it("Tóquio e São Paulo na mesma data têm céus completamente distintos", () => {
    const sp    = computeSkyData("2024-06-21", -23.5505, -46.6333)
    const tokyo = computeSkyData("2024-06-21",  35.6762, 139.6503)
    // Hemisfério oposto e UTC+9 vs UTC-3 → céu totalmente diferente
    expect(sp.season).not.toBe(tokyo.season)
  })
})
