import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CityCombobox } from "@/components/city-combobox"

// ── Mock do fetch de municípios ───────────────────────────────────────────────
const MOCK_MUNICIPIOS = [
  { nome: "São Paulo",         uf: "SP" },
  { nome: "Santos",            uf: "SP" },
  { nome: "Santo André",       uf: "SP" },
  { nome: "Curitiba",          uf: "PR" },
  { nome: "Florianópolis",     uf: "SC" },
  { nome: "Juazeiro do Norte", uf: "CE" },
]

beforeAll(() => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(MOCK_MUNICIPIOS), {
      status:  200,
      headers: { "Content-Type": "application/json" },
    })),
  ))
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInput() {
  return screen.getByPlaceholderText("São Paulo, SP") as HTMLInputElement
}

/**
 * Foca o input, digita um valor e faz blur.
 * Usa waitFor para garantir que o estado de loading assíncrono (dynamic import)
 * seja resolvido antes de avaliar as asserções.
 */
async function typeAndBlur(input: HTMLInputElement, value: string) {
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value } })
  fireEvent.blur(input)
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("CityCombobox", () => {

  describe("renderização inicial", () => {
    it("renderiza o input com placeholder", () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      expect(getInput()).toBeInTheDocument()
    })

    it("não exibe erro antes de qualquer interação", () => {
      render(<CityCombobox value="qualquer coisa" onChange={() => {}} />)
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("exibe o valor inicial no input", () => {
      render(<CityCombobox value="São Paulo, SP" onChange={() => {}} />)
      expect(getInput().value).toBe("São Paulo, SP")
    })
  })

  describe("validação — cidade inválida", () => {
    it("exibe erro ao sair do campo com texto que não é cidade", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      await typeAndBlur(getInput(), "Cidade Inexistente XYZ")

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(screen.getByRole("alert")).toHaveTextContent(/cidade não encontrada/i)
      })
    })

    it("não exibe erro enquanto o campo está focado (não atrapalha a digitação)", () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      const input = getInput()

      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: "Cidade Invalida" } })
      // Sem blur — campo ainda está focado

      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })

    it("não exibe erro quando o valor está vazio (required cuida disso separadamente)", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      const input = getInput()

      fireEvent.focus(input)
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      })
    })

    it("input tem setCustomValidity preenchido para cidade inválida", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      const input = getInput()

      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: "Cidade Invalida XYZ" } })

      // Aguarda o carregamento dos dados e re-avaliação da validade
      await waitFor(() => {
        expect(input.validity.customError).toBe(true)
      })
    })

    it("adiciona borda vermelha quando inválido e tocado", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      await typeAndBlur(getInput(), "Texto Invalido")

      await waitFor(() => {
        expect(getInput()).toHaveClass("border-destructive")
      })
    })

    it("marca aria-invalid quando inválido e tocado", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      await typeAndBlur(getInput(), "Texto Invalido")

      await waitFor(() => {
        expect(getInput()).toHaveAttribute("aria-invalid", "true")
      })
    })
  })

  describe("validação — cidade válida", () => {
    it("não exibe erro para valor que bate exatamente com um município", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      await typeAndBlur(getInput(), "São Paulo, SP")

      // waitFor aguarda o dynamic import resolver + exactMatch ser avaliado
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it("aceita versão sem acento do nome (normalização NFD)", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      // "Florianopolis" sem acento → normaliza para "florianopolis"
      // "Florianópolis" normalizado → também "florianopolis" → match!
      await typeAndBlur(getInput(), "Florianopolis, SC")

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it("setCustomValidity vazio para município válido", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      const input = getInput()

      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: "São Paulo, SP" } })

      // Aguarda dados carregarem e isValid ser recalculado
      await waitFor(() => {
        expect(input.validity.customError).toBe(false)
      }, { timeout: 2000 })
    })

    it("não tem borda de erro para município válido após blur", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      await typeAndBlur(getInput(), "Curitiba, PR")

      await waitFor(() => {
        expect(getInput()).not.toHaveClass("border-destructive")
      }, { timeout: 2000 })
    })

    it("não marca aria-invalid para município válido", async () => {
      render(<CityCombobox value="" onChange={() => {}} />)
      await typeAndBlur(getInput(), "Curitiba, PR")

      await waitFor(() => {
        expect(getInput()).not.toHaveAttribute("aria-invalid", "true")
      }, { timeout: 2000 })
    })
  })

  describe("sincronização com valor externo", () => {
    it("chama onChange ao digitar", () => {
      const onChange = vi.fn()
      render(<CityCombobox value="" onChange={onChange} />)
      fireEvent.change(getInput(), { target: { value: "São" } })
      expect(onChange).toHaveBeenCalledWith("São")
    })

    it("atualiza o input quando o value externo muda", () => {
      const { rerender } = render(<CityCombobox value="São Paulo, SP" onChange={() => {}} />)
      expect(getInput().value).toBe("São Paulo, SP")

      rerender(<CityCombobox value="Curitiba, PR" onChange={() => {}} />)
      expect(getInput().value).toBe("Curitiba, PR")
    })
  })
})
