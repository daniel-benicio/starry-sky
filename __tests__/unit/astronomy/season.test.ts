import { describe, it, expect } from "vitest"
import { getSeason } from "@/lib/astronomy/season"

describe("getSeason", () => {
  // Hemisfério Sul (latitude negativa)
  it("Dezembro no hemisfério Sul é Verão", () => {
    expect(getSeason(12, -23)).toBe("Verão")
  })

  it("Janeiro no hemisfério Sul é Verão", () => {
    expect(getSeason(1, -23)).toBe("Verão")
  })

  it("Fevereiro no hemisfério Sul é Verão", () => {
    expect(getSeason(2, -23)).toBe("Verão")
  })

  it("Junho no hemisfério Sul é Inverno", () => {
    expect(getSeason(6, -23)).toBe("Inverno")
  })

  it("Julho no hemisfério Sul é Inverno", () => {
    expect(getSeason(7, -15)).toBe("Inverno")
  })

  it("Março no hemisfério Sul é Outono", () => {
    expect(getSeason(3, -23)).toBe("Outono")
  })

  it("Setembro no hemisfério Sul é Primavera", () => {
    expect(getSeason(9, -23)).toBe("Primavera")
  })

  // Hemisfério Norte (latitude positiva)
  it("Dezembro no hemisfério Norte é Inverno", () => {
    expect(getSeason(12, 40)).toBe("Inverno")
  })

  it("Junho no hemisfério Norte é Verão", () => {
    expect(getSeason(6, 40)).toBe("Verão")
  })

  it("Março no hemisfério Norte é Primavera", () => {
    expect(getSeason(3, 51)).toBe("Primavera")
  })

  it("Setembro no hemisfério Norte é Outono", () => {
    expect(getSeason(9, 51)).toBe("Outono")
  })

  // Casos especiais
  it("latitude exatamente 0 usa hemisfério Norte (não negativo)", () => {
    const result = getSeason(7, 0)
    expect(result).toBe("Verão") // hemisfério Norte: Julho = Verão
  })

  it("latitude muito sul (Antártida) ainda funciona", () => {
    expect(getSeason(12, -90)).toBe("Verão")
  })

  it("latitude muito norte (Ártico) ainda funciona", () => {
    expect(getSeason(12, 90)).toBe("Inverno")
  })
})
