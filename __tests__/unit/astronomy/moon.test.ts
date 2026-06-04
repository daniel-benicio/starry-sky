import { describe, it, expect } from "vitest"
import { describeMoonPhase } from "@/lib/astronomy/moon"

describe("describeMoonPhase", () => {
  it("identifica Lua Nova em data conhecida (2024-01-11)", () => {
    const date = new Date("2024-01-11T01:00:00Z")
    expect(describeMoonPhase(date)).toContain("Lua Nova")
  })

  it("identifica Lua Cheia em data conhecida (2024-01-25)", () => {
    const date = new Date("2024-01-25T01:00:00Z")
    expect(describeMoonPhase(date)).toContain("Lua Cheia")
  })

  it("identifica Lua Crescente com percentual válido", () => {
    // ~1 semana após lua nova de jan 2024
    const date = new Date("2024-01-18T01:00:00Z")
    const result = describeMoonPhase(date)
    expect(result).toContain("Crescente")
    const pct = parseInt(result.match(/\d+/)?.[0] ?? "-1")
    expect(pct).toBeGreaterThanOrEqual(0)
    expect(pct).toBeLessThanOrEqual(100)
  })

  it("identifica Lua Minguante com percentual válido", () => {
    // ~1 semana após lua cheia de jan 2024
    const date = new Date("2024-02-01T01:00:00Z")
    const result = describeMoonPhase(date)
    expect(result).toContain("Minguante")
    const pct = parseInt(result.match(/\d+/)?.[0] ?? "-1")
    expect(pct).toBeGreaterThanOrEqual(0)
    expect(pct).toBeLessThanOrEqual(100)
  })

  it("retorna sempre uma string não-vazia", () => {
    const dates = [
      new Date("2020-01-01T01:00:00Z"),
      new Date("2023-06-15T01:00:00Z"),
      new Date("2025-12-25T01:00:00Z"),
    ]
    for (const date of dates) {
      expect(describeMoonPhase(date)).toBeTruthy()
    }
  })

  it("retorna uma das fases conhecidas", () => {
    const fases = ["Lua Nova", "Lua Cheia", "Crescente", "Minguante"]
    const date = new Date("2024-03-10T01:00:00Z")
    const result = describeMoonPhase(date)
    expect(fases.some((f) => result.includes(f))).toBe(true)
  })
})
