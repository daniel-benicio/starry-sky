import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { OrderForm } from "@/components/order-form"

// ── Mock do CityCombobox ──────────────────────────────────────────────────────
// Isola este teste do comportamento do combobox; a cidade é testada separadamente.
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

const today      = () => new Date().toISOString().split("T")[0]
const relDate    = (d: number) => {
  const dt = new Date()
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().split("T")[0]
}

const getDateInput  = () => screen.getByLabelText(/data em que tudo começou/i) as HTMLInputElement
const getForm       = () => screen.getByTestId("order-form")

// ── Testes ────────────────────────────────────────────────────────────────────

describe("OrderForm — validação da data", () => {

  describe("atributo max", () => {
    it("o input de data tem max igual a hoje", () => {
      render(<OrderForm />)
      expect(getDateInput()).toHaveAttribute("max", today())
    })
  })

  describe("data passada ou hoje (válida)", () => {
    it("não exibe erro para ontem", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(-1) } })
      fireEvent.blur(getDateInput())
      expect(screen.queryByText(/não pode ser no futuro/i)).not.toBeInTheDocument()
    })

    it("não exibe erro para hoje", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: today() } })
      fireEvent.blur(getDateInput())
      expect(screen.queryByText(/não pode ser no futuro/i)).not.toBeInTheDocument()
    })

    it("não exibe erro para data histórica", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: "1985-07-10" } })
      fireEvent.blur(getDateInput())
      expect(screen.queryByText(/não pode ser no futuro/i)).not.toBeInTheDocument()
    })
  })

  describe("data futura (inválida)", () => {
    it("não exibe erro enquanto o campo ainda está focado", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+1) } })
      // sem blur
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

    it("exibe erro ao receber onInvalid (submit com data futura sem blur)", () => {
      render(<OrderForm />)
      fireEvent.change(getDateInput(), { target: { value: relDate(+1) } })
      fireEvent.invalid(getDateInput())
      expect(screen.getByText(/a data não pode ser no futuro/i)).toBeInTheDocument()
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

      fireEvent.change(getDateInput(), { target: { value: "2024-02-14" } })
      fireEvent.change(screen.getByTestId("city-input"), { target: { value: "São Paulo, SP" } })
      fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: "ana@email.com" } })
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
  })
})
