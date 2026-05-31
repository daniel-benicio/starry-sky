import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCheckoutForm } from "@/hooks/use-checkout-form"
import type { OrderData } from "@/types/order"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock global fetch — the hook calls /api/generate-result before redirecting
const mockFetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as Response)
)
vi.stubGlobal("fetch", mockFetch)

const ORDER: OrderData = {
  date:  "2024-02-14",
  city:  "São Paulo",
  email: "ana@email.com",
  name1: "Ana",
  name2: "Lucas",
}

describe("useCheckoutForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Restaura o mock de fetch para sucesso após cada teste
    mockFetch.mockResolvedValue({
      ok:   true,
      json: () => Promise.resolve({ success: true }),
    } as Response)
  })

  it("inicia com campos vazios", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    expect(result.current.fields.number).toBe("")
    expect(result.current.fields.name).toBe("")
    expect(result.current.fields.document).toBe("")
    expect(result.current.fields.expiry).toBe("")
    expect(result.current.fields.cvv).toBe("")
  })

  it("formata número do cartão ao chamar setField", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    act(() => {
      result.current.setField("number", "4111111111111111")
    })
    expect(result.current.fields.number).toBe("4111 1111 1111 1111")
  })

  it("formata CPF ao chamar setField", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    act(() => {
      result.current.setField("document", "12345678901")
    })
    expect(result.current.fields.document).toBe("123.456.789-01")
  })

  it("formata validade ao chamar setField", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    act(() => {
      result.current.setField("expiry", "1225")
    })
    expect(result.current.fields.expiry).toBe("12/25")
  })

  it("não altera campo name (sem formatação)", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    act(() => {
      result.current.setField("name", "ANA SOUZA")
    })
    expect(result.current.fields.name).toBe("ANA SOUZA")
  })

  it("isCVVFocused começa false", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    expect(result.current.isCVVFocused).toBe(false)
  })

  it("onCVVFocus seta isCVVFocused para true", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    act(() => {
      result.current.onCVVFocus()
    })
    expect(result.current.isCVVFocused).toBe(true)
  })

  it("onCVVBlur seta isCVVFocused de volta para false", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    act(() => {
      result.current.onCVVFocus()
    })
    act(() => {
      result.current.onCVVBlur()
    })
    expect(result.current.isCVVFocused).toBe(false)
  })

  it("isLoading começa false", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    expect(result.current.isLoading).toBe(false)
  })

  it("redireciona para /result após submit com os dados do pedido", async () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER))
    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.onSubmit(fakeEvent)
    })
    // O cookie é gerado server-side via /api/generate-result;
    // o redirect vai para /result sem query params.
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/generate-result",
      expect.objectContaining({ method: "POST" }),
    )
    expect(mockPush).toHaveBeenCalledWith("/result")
  })

  it("seta error quando /api/generate-result retorna erro", async () => {
    mockFetch.mockResolvedValueOnce({
      ok:   false,
      json: () => Promise.resolve({ message: "Dados incompletos." }),
    } as Response)

    const { result } = renderHook(() => useCheckoutForm(ORDER))
    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.onSubmit(fakeEvent)
    })

    expect(mockPush).not.toHaveBeenCalled()
    expect(result.current.error).toBe("Dados incompletos.")
  })
})
