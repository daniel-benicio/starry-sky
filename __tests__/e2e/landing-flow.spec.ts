import { test, expect, type Page } from "@playwright/test"

// ── Helper: seleciona uma cidade no CityCombobox ──────────────────────────────
// 1. Digita o prefixo para abrir o dropdown
// 2. Aguarda o primeiro item aparecer e clica nele
async function fillCity(page: Page, query: string) {
  const input = page.locator('input[id="city"]')
  await input.fill(query)
  // Aguarda pelo menos um item de sugestão aparecer (dados carregados + filtro)
  const firstItem = page.locator('[cmdk-item]').first()
  await firstItem.waitFor({ state: "visible", timeout: 8_000 })
  await firstItem.click()
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Landing page — formulário de pedido", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
  })

  test("exibe a landing page com o formulário", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test("botão de submit com formulário vazio mantém na mesma URL", async ({ page }) => {
    await page.getByRole("button", { name: /gerar meu céu/i }).click()
    await expect(page).toHaveURL("/")
  })

  test("preencher todos os campos e submeter redireciona para /pagamento", async ({ page }) => {
    await page.locator('input[type="date"]').fill("2024-02-14")
    await fillCity(page, "São Paulo")
    await page.locator('input[type="email"]').fill("ana@email.com")
    await page.locator('input[id="name1"]').fill("Ana")
    await page.locator('input[id="name2"]').fill("Lucas")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()

    await expect(page).toHaveURL(/\/pagamento/)
  })

  test("URL de pagamento contém os dados do formulário", async ({ page }) => {
    await page.locator('input[type="date"]').fill("2024-02-14")
    await fillCity(page, "Curitiba")
    await page.locator('input[type="email"]').fill("teste@mail.com")
    await page.locator('input[id="name1"]').fill("Pedro")
    await page.locator('input[id="name2"]').fill("Maria")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()
    await expect(page).toHaveURL(/\/pagamento/)

    const url = page.url()
    // "Curitiba, PR" é URL-encoded — "city=Curitiba" ainda é substring válida
    expect(url).toContain("city=Curitiba")
    expect(url).toContain("name1=Pedro")
    expect(url).toContain("name2=Maria")
  })

  // ── Validação: data futura ─────────────────────────────────────────────────

  test("data futura exibe mensagem de erro ao sair do campo", async ({ page }) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    await page.locator('input[type="date"]').fill(tomorrowStr)
    await page.locator('input[type="date"]').blur()

    await expect(page.getByText(/a data não pode ser no futuro/i)).toBeVisible()
  })

  test("data futura impede o submit e exibe erro", async ({ page }) => {
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    const nextYearStr = nextYear.toISOString().split("T")[0]

    await page.locator('input[type="date"]').fill(nextYearStr)
    await fillCity(page, "São Paulo")
    await page.locator('input[type="email"]').fill("teste@mail.com")
    await page.locator('input[id="name1"]').fill("Pedro")
    await page.locator('input[id="name2"]').fill("Maria")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()

    // Permanece na landing — submit foi bloqueado
    await expect(page).toHaveURL("/")
    await expect(page.getByText(/a data não pode ser no futuro/i)).toBeVisible()
  })

  // ── Validação: cidade inválida ─────────────────────────────────────────────

  test("cidade digitada sem selecionar da lista exibe erro ao sair do campo", async ({ page }) => {
    const cityInput = page.locator('input[id="city"]')
    await cityInput.fill("CidadeInexistente123")
    await cityInput.blur()

    await expect(page.getByText(/cidade não encontrada/i)).toBeVisible()
  })

  test("cidade inválida impede o submit", async ({ page }) => {
    await page.locator('input[type="date"]').fill("2024-02-14")
    // Digita no campo mas NÃO seleciona da lista
    await page.locator('input[id="city"]').fill("CidadeInexistente123")
    await page.locator('input[type="email"]').fill("teste@mail.com")
    await page.locator('input[id="name1"]').fill("Pedro")
    await page.locator('input[id="name2"]').fill("Maria")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()

    await expect(page).toHaveURL("/")
  })

  // ── Responsividade ─────────────────────────────────────────────────────────

  test("versão mobile exibe formulário sem overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")

    const form = page.locator("form")
    await expect(form).toBeVisible()

    const formBox = await form.boundingBox()
    expect(formBox?.width).toBeLessThanOrEqual(375)
  })
})
