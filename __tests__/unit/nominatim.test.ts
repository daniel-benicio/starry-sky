import { describe, it, expect, vi, afterEach } from "vitest"
import { nominatimGeocode } from "@/lib/nominatim"

// Mock global fetch para não fazer chamadas de rede reais nos testes
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

function makeNominatimResponse(results: object[]): Response {
  return new Response(JSON.stringify(results), {
    status:  200,
    headers: { "Content-Type": "application/json" },
  })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("nominatimGeocode", () => {
  it("retorna coordenadas para uma cidade encontrada", async () => {
    mockFetch.mockResolvedValue(
      makeNominatimResponse([{
        lat:          "-23.5505",
        lon:          "-46.6333",
        display_name: "São Paulo, Região Metropolitana de São Paulo, SP, Brasil",
      }]),
    )

    const result = await nominatimGeocode("São Paulo")
    expect(result).not.toBeNull()
    expect(result?.lat).toBeCloseTo(-23.5505)
    expect(result?.lon).toBeCloseTo(-46.6333)
    expect(result?.displayName).toBe("São Paulo")
  })

  it("extrai apenas o primeiro segmento do display_name verboso", async () => {
    mockFetch.mockResolvedValue(
      makeNominatimResponse([{
        lat:          "-7.2306",
        lon:          "-39.3167",
        display_name: "Juazeiro do Norte, Região Geográfica Imediata de Juazeiro do Norte, CE, Brasil",
      }]),
    )

    const result = await nominatimGeocode("Juazeiro do Norte")
    expect(result?.displayName).toBe("Juazeiro do Norte")
  })

  it("retorna null quando a lista de resultados está vazia", async () => {
    mockFetch.mockResolvedValue(makeNominatimResponse([]))

    const result = await nominatimGeocode("CidadeInexistenteXYZ")
    expect(result).toBeNull()
  })

  it("retorna null quando a requisição HTTP falha (status 5xx)", async () => {
    mockFetch.mockResolvedValue(new Response("", { status: 503 }))

    const result = await nominatimGeocode("São Paulo")
    expect(result).toBeNull()
  })

  it("retorna null quando fetch lança exceção (rede indisponível)", async () => {
    mockFetch.mockRejectedValue(new Error("network error"))

    const result = await nominatimGeocode("São Paulo")
    expect(result).toBeNull()
  })

  it("retorna null para string vazia sem chamar fetch", async () => {
    const result = await nominatimGeocode("")
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("retorna null para string só de espaços sem chamar fetch", async () => {
    const result = await nominatimGeocode("   ")
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("inclui User-Agent na requisição", async () => {
    mockFetch.mockResolvedValue(makeNominatimResponse([{
      lat: "-23.5505", lon: "-46.6333", display_name: "São Paulo",
    }]))

    await nominatimGeocode("São Paulo")

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)?.["User-Agent"]).toMatch(/starry-sky/)
  })

  it("envia o nome da cidade na query string", async () => {
    mockFetch.mockResolvedValue(makeNominatimResponse([{
      lat: "-8.0539", lon: "-34.8811", display_name: "Recife",
    }]))

    await nominatimGeocode("Recife")

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toContain("q=Recife")
    expect(url).toContain("format=json")
  })
})
