import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCheckoutForm } from "@/hooks/use-checkout-form"
import type { OrderData } from "@/types/order"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockConfirmCardPayment = vi.fn()
const mockGetElement = vi.fn(() => ({}))
vi.mock("@stripe/react-stripe-js", () => ({
  useStripe:   () => ({ confirmCardPayment: mockConfirmCardPayment }),
  useElements: () => ({ getElement: mockGetElement }),
  CardNumberElement: {},
}))

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

const ORDER: OrderData = {
  date:  "2024-02-14",
  city:  "São Paulo",
  email: "ana@email.com",
  name1: "Ana",
  name2: "Lucas",
}

const CLIENT_SECRET = "pi_test_secret_123"

const successPaymentIntent = { id: "pi_test_123", status: "succeeded" }

describe("useCheckoutForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirmCardPayment.mockResolvedValue({ paymentIntent: successPaymentIntent })
    mockFetch.mockResolvedValue({
      ok:   true,
      json: () => Promise.resolve({ success: true }),
    } as Response)
  })

  it("inicia com campos vazios", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    expect(result.current.fields.name).toBe("")
    expect(result.current.fields.document).toBe("")
    expect(result.current.fields.brand).toBe("")
  })

  it("formata CPF ao chamar setField document", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    act(() => { result.current.setField("document", "12345678901") })
    expect(result.current.fields.document).toBe("123.456.789-01")
  })

  it("não altera campo name (sem formatação)", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    act(() => { result.current.setField("name", "ANA SOUZA") })
    expect(result.current.fields.name).toBe("ANA SOUZA")
  })

  it("setBrand atualiza brand", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    act(() => { result.current.setBrand("visa") })
    expect(result.current.fields.brand).toBe("visa")
  })

  it("isCVVFocused começa false", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    expect(result.current.isCVVFocused).toBe(false)
  })

  it("onCVVFocus seta isCVVFocused para true", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    act(() => { result.current.onCVVFocus() })
    expect(result.current.isCVVFocused).toBe(true)
  })

  it("onCVVBlur seta isCVVFocused de volta para false", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    act(() => { result.current.onCVVFocus() })
    act(() => { result.current.onCVVBlur() })
    expect(result.current.isCVVFocused).toBe(false)
  })

  it("isLoading começa false", () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    expect(result.current.isLoading).toBe(false)
  })

  it("redireciona para /result após submit bem-sucedido", async () => {
    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.onSubmit(fakeEvent)
    })

    expect(mockConfirmCardPayment).toHaveBeenCalledWith(
      CLIENT_SECRET,
      expect.objectContaining({ payment_method: expect.any(Object) }),
    )
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/checkout",
      expect.objectContaining({ method: "POST" }),
    )
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/generate-result",
      expect.objectContaining({ method: "POST" }),
    )
    expect(mockPush).toHaveBeenCalledWith("/result")
  })

  it("seta error quando Stripe recusa cartão", async () => {
    mockConfirmCardPayment.mockResolvedValueOnce({
      error: { message: "Seu cartão foi recusado." },
    })

    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.onSubmit(fakeEvent)
    })

    expect(mockPush).not.toHaveBeenCalled()
    expect(result.current.error).toBe("Seu cartão foi recusado.")
  })

  it("seta error quando /api/checkout retorna erro", async () => {
    mockFetch.mockResolvedValueOnce({
      ok:   false,
      json: () => Promise.resolve({ message: "Erro ao registrar pedido." }),
    } as Response)

    const { result } = renderHook(() => useCheckoutForm(ORDER, CLIENT_SECRET))
    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.onSubmit(fakeEvent)
    })

    expect(mockPush).not.toHaveBeenCalled()
    expect(result.current.error).toBe("Erro ao registrar pedido.")
  })
})
