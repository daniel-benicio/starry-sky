import { describe, it, expect } from "vitest"
import { formatCardNumber, formatExpiry, formatCpf, formatDate, getFirstAndLastName } from "@/lib/formatters"

describe("formatCardNumber", () => {
  it("formata 16 dígitos em grupos de 4", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111")
  })

  it("remove letras e formata apenas os dígitos restantes", () => {
    // "4111abc111111111" tem 13 dígitos após remoção das letras
    expect(formatCardNumber("4111abc111111111")).toBe("4111 1111 1111 1")
  })

  it("trunca em 16 dígitos", () => {
    expect(formatCardNumber("41111111111111119")).toBe("4111 1111 1111 1111")
  })

  it("retorna vazio para string vazia", () => {
    expect(formatCardNumber("")).toBe("")
  })

  it("formata parcialmente com menos de 4 dígitos", () => {
    expect(formatCardNumber("411")).toBe("411")
  })

  it("formata 8 dígitos em dois grupos", () => {
    expect(formatCardNumber("41111111")).toBe("4111 1111")
  })
})

describe("formatExpiry", () => {
  it("formata 4 dígitos com barra", () => {
    expect(formatExpiry("1225")).toBe("12/25")
  })

  it("não adiciona barra com apenas 2 dígitos", () => {
    expect(formatExpiry("12")).toBe("12")
  })

  it("remove letras antes de formatar", () => {
    expect(formatExpiry("1a25")).toBe("12/5")
  })

  it("retorna vazio para string vazia", () => {
    expect(formatExpiry("")).toBe("")
  })

  it("trunca em 4 dígitos", () => {
    expect(formatExpiry("122599")).toBe("12/25")
  })
})

describe("formatCpf", () => {
  it("formata CPF completo com 11 dígitos", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01")
  })

  it("formata parcialmente com 6 dígitos", () => {
    expect(formatCpf("123456")).toBe("123.456")
  })

  it("formata parcialmente com 4 dígitos", () => {
    expect(formatCpf("1234")).toBe("123.4")
  })

  it("não formata com 3 ou menos dígitos", () => {
    expect(formatCpf("123")).toBe("123")
  })

  it("trunca em 11 dígitos", () => {
    expect(formatCpf("123456789012")).toBe("123.456.789-01")
  })

  it("retorna vazio para string vazia", () => {
    expect(formatCpf("")).toBe("")
  })

  it("remove não-dígitos antes de formatar", () => {
    expect(formatCpf("123.456.789-01")).toBe("123.456.789-01")
  })
})

describe("formatDate", () => {
  it("formata data no formato ISO (YYYY-MM-DD)", () => {
    expect(formatDate("2024-06-21")).toBe("21 de junho de 2024")
  })

  it("formata data no formato brasileiro (DD/MM/YYYY)", () => {
    expect(formatDate("21/06/2024")).toBe("21 de junho de 2024")
  })

  it("retorna vazio para string vazia", () => {
    expect(formatDate("")).toBe("")
  })

  it("formata corretamente para janeiro", () => {
    expect(formatDate("2024-01-01")).toBe("1 de janeiro de 2024")
  })

  it("formata corretamente para dezembro", () => {
    expect(formatDate("2024-12-31")).toBe("31 de dezembro de 2024")
  })

  it("formata corretamente para fevereiro", () => {
    expect(formatDate("2000-02-14")).toBe("14 de fevereiro de 2000")
  })
})

describe("getFirstAndLastName", () => {
  it("retorna o nome inalterado quando há apenas uma palavra", () => {
    expect(getFirstAndLastName("Lucas")).toBe("Lucas")
  })

  it("retorna o nome inalterado quando há exatamente dois nomes", () => {
    expect(getFirstAndLastName("Ana Costa")).toBe("Ana Costa")
  })

  it("extrai primeiro e último nome quando há um nome do meio", () => {
    expect(getFirstAndLastName("João Carlos Silva")).toBe("João Silva")
  })

  it("extrai primeiro e último nome em nome composto longo", () => {
    expect(getFirstAndLastName("Maria Fernanda Costa Pereira")).toBe("Maria Pereira")
  })

  it("remove espaços extras nas bordas", () => {
    expect(getFirstAndLastName("  Ana Costa  ")).toBe("Ana Costa")
  })

  it("lida com múltiplos espaços internos como separadores únicos", () => {
    expect(getFirstAndLastName("Ana   Costa")).toBe("Ana Costa")
  })

  it("retorna string vazia para string vazia", () => {
    expect(getFirstAndLastName("")).toBe("")
  })

  it("retorna string vazia para string só com espaços", () => {
    expect(getFirstAndLastName("   ")).toBe("")
  })
})
