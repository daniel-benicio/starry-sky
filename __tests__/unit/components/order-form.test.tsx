import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { OrderForm } from "@/components/order-form"

// ── Mock do CityCombobox ──────────────────────────────────────────────────────
vi.mock("@/components/city-combobox", () => ({
  CityCombobox: ({
    value,
    onChange,
    required,
    id,
  }: {
    value: string
    onChange: (v: string) => void
    required?: boolean
    id?: string
  }) => (
    <input
      id={id}
      data-testid="city-input"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  ),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Retorna data no formato DD/MM/YYYY com offset em dias a partir de hoje. */
const relDate = (d: number): string => {
  const dt = new Date()
  dt.setDate(dt.getDate() + d)
  const [yyyy, mm, dd] = dt.toISOString().split("T")[0].split("-")
  return `${dd}/${mm}/${yyyy}`
}

const getDateInput = () => screen.getByLabelText(/data em que tudo começou/i) as HTMLInputElement
const getForm      = () => screen.getByTestId("order-form")

// ── Testes ────────────────────────────────────────────────────────────────────

describe("OrderForm — validação da data", () => {

  describe("data passada ou hoje (válida)", () => {
    it("não exibe erro para ontem", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(-1) } })
      fireEvent.blur(getDateInput())
      expect(screen.queryByText(/não pode ser no futuro/i)).not.toBeInTheDocument()
    })

    it("não exibe erro para hoje", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(0) } })
      fireEvent.blur(getDateInput())
      expect(screen.queryByText(/não pode ser no futuro/i)).not.toBeInTheDocument()
    })

    it("não exibe erro para data histórica", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: "10/07/1985" } })
      fireEvent.blur(getDateInput())
      expect(screen.queryByText(/não pode ser no futuro/i)).not.toBeInTheDocument()
    })
  })

  describe("data futura (inválida)", () => {
    it("não exibe erro enquanto o campo ainda está focado", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+1) } })
      expect(screen.queryByText(/não pode ser no futuro/i)).not.toBeInTheDocument()
    })

    it("exibe erro ao sair do campo com data futura", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+1) } })
      fireEvent.blur(getDateInput())
      expect(screen.getByText(/a data não pode ser no futuro/i)).toBeInTheDocument()
    })

    it("exibe borda de erro no input", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+30) } })
      fireEvent.blur(getDateInput())
      expect(getDateInput()).toHaveClass("border-destructive")
    })

    it("erro tem role=alert para acessibilidade", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+1) } })
      fireEvent.blur(getDateInput())
      expect(screen.getByRole("alert")).toHaveTextContent(/não pode ser no futuro/i)
    })

    it("não chama onSubmit quando a data é futura", () => {
      const onSubmit = vi.fn()
      render(<OrderForm onSubmit={onSubmit} />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+1) } })
      fireEvent.submit(getForm())
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it("exibe o erro ao tentar submeter com data futura", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+1) } })
      fireEvent.submit(getForm())
      expect(screen.getByText(/a data não pode ser no futuro/i)).toBeInTheDocument()
    })
  })

  describe("erro some após corrigir a data", () => {
    it("remove o erro quando uma data válida substitui a inválida", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+1) } })
      fireEvent.blur(getDateInput())
      expect(screen.getByText(/não pode ser no futuro/i)).toBeInTheDocument()

      fireEvent.change(getDateInput(), { target: { value: relDate(-1) } })
      expect(screen.queryByText(/não pode ser no futuro/i)).not.toBeInTheDocument()
    })
  })

  describe("submit com dados válidos", () => {
    it("chama onSubmit com os dados corretos", () => {
      const onSubmit = vi.fn()
      render(<OrderForm onSubmit={onSubmit} />)

      fireEvent.change(getDateInput(), { target: { value: "14/02/2024" } })
      fireEvent.change(screen.getByTestId("city-input"),    { target: { value: "São Paulo, SP" } })
      fireEvent.change(screen.getByLabelText(/e-mail/i),    { target: { value: "ana@email.com" } })
      fireEvent.change(screen.getByLabelText(/nome dele/i), { target: { value: "Pedro" } })
      fireEvent.change(screen.getByLabelText(/nome dela/i), { target: { value: "Ana" } })

      fireEvent.submit(getForm())

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          date:  "2024-02-14",
          city:  "São Paulo, SP",
          email: "ana@email.com",
          name1: "Pedro",
          name2: "Ana",
        })
      )
    })

    it("exibe erro de data inválida ao submeter sem data", () => {
      render(<OrderForm />)
      fireEvent.submit(getForm())
      expect(screen.getByText(/informe uma data válida/i)).toBeInTheDocument()
    })
  })
})
