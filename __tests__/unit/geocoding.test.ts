import { describe, it, expect } from "vitest"
import { geocodeCity } from "@/lib/geocoding"

describe("geocodeCity", () => {
  it("encontra cidade por nome exato lowercase", () => {
    const result = geocodeCity("são paulo")
    expect(result?.lat).toBeCloseTo(-23.5505)
    expect(result?.displayName).toBe("São Paulo")
  })

  it("encontra cidade por alias curto", () => {
    const result = geocodeCity("sp")
    expect(result?.lat).toBeCloseTo(-23.5505)
  })

  it("encontra cidade sem acento quando o input tem acento", () => {
    const r1 = geocodeCity("florianópolis")
    const r2 = geocodeCity("florianopolis")
    expect(r1?.lat).toBe(r2?.lat)
    expect(r1?.lon).toBe(r2?.lon)
  })

  it("ignora texto após vírgula", () => {
    const result = geocodeCity("Rio de Janeiro, RJ")
    expect(result?.displayName).toBe("Rio de Janeiro")
  })

  it("encontra cidade por match parcial", () => {
    const result = geocodeCity("porto alegre centro")
    expect(result?.displayName).toBe("Porto Alegre")
  })

  it("retorna null para cidade desconhecida", () => {
    expect(geocodeCity("Cidade Inexistente XYZ")).toBeNull()
  })

  it("retorna null para string vazia", () => {
    expect(geocodeCity("")).toBeNull()
  })

  it("ignora espaços extras no input", () => {
    const result = geocodeCity("  curitiba  ")
    expect(result?.displayName).toBe("Curitiba")
  })

  it("encontra cidade internacional", () => {
    const result = geocodeCity("paris")
    expect(result?.lat).toBeCloseTo(48.8566)
  })

  it("encontra alias 'rj' para Rio de Janeiro", () => {
    const result = geocodeCity("rj")
    expect(result?.displayName).toBe("Rio de Janeiro")
  })

  it("encontra 'bh' para Belo Horizonte", () => {
    const result = geocodeCity("bh")
    expect(result?.displayName).toBe("Belo Horizonte")
  })

  it("encontra cidade do hemisfério Norte", () => {
    const result = geocodeCity("new york")
    expect(result?.lat).toBeGreaterThan(0)
  })
})
