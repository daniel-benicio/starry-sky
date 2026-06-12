import { test, expect, type Page } from "@playwright/test"

// ── Helper: seleciona uma cidade no CityCombobox ──────────────────────────────
async function fillCity(page: Page, query: string) {
  const input = page.locator('input[id="city"]')
  await input.fill(query)
  const firstItem = page.locator('[cmdk-item]').first()
  await firstItem.waitFor({ state: "visible", timeout: 8_000 })
  await firstItem.click()
}

// ── Helper: retorna data no formato DD/MM/YYYY com offset em dias ─────────────
function relDate(offsetDays: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() + offsetDays)
  const [yyyy, mm, dd] = dt.toISOString().split("T")[0].split("-")
  return `${dd}/${mm}/${yyyy}`
}

const getDateInput = (page: Page) => page.locator('input[placeholder="DD/MM/AAAA"]')

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Landing page — formulário de pedido", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
  })

  test("exibe a landing page com o formulário", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(getDateInput(page)).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test("exibe preço R$ 4,99 no hero e na seção como funciona", async ({ page }) => {
    await expect(page.getByText("R$ 4,99", { exact: true })).toBeVisible()
    await expect(page.getByText(/pagamento único de r\$4,99/i)).toBeVisible()
  })

  test("botão de submit com formulário vazio mantém na mesma URL", async ({ page }) => {
    await page.getByRole("button", { name: /gerar meu céu/i }).click()
    await expect(page).toHaveURL("/")
  })

  test("preencher todos os campos e submeter redireciona para /pagamento", async ({ page }) => {
    await getDateInput(page).fill("14/02/2024")
    await fillCity(page, "São Paulo")
    await page.locator('input[type="email"]').fill("ana@email.com")
    await page.locator('input[id="name1"]').fill("Ana")
    await page.locator('input[id="name2"]').fill("Lucas")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()

    await expect(page).toHaveURL(/\/pagamento/)
  })

  test("URL de pagamento contém os dados do formulário", async ({ page }) => {
    await getDateInput(page).fill("14/02/2024")
    await fillCity(page, "Curitiba")
    await page.locator('input[type="email"]').fill("teste@mail.com")
    await page.locator('input[id="name1"]').fill("Pedro")
    await page.locator('input[id="name2"]').fill("Maria")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()
    await expect(page).toHaveURL(/\/pagamento/)

    const url = page.url()
    expect(url).toContain("city=Curitiba")
    expect(url).toContain("name1=Pedro")
    expect(url).toContain("name2=Maria")
  })

  // ── Validação: data futura ─────────────────────────────────────────────────

  test("data futura exibe mensagem de erro ao sair do campo", async ({ page }) => {
    await getDateInput(page).fill(relDate(+1))
    await getDateInput(page).blur()

    await expect(page.getByText(/a data não pode ser no futuro/i)).toBeVisible()
  })

  test("data futura impede o submit e exibe erro", async ({ page }) => {
    await getDateInput(page).fill(relDate(+365))
    await fillCity(page, "São Paulo")
    await page.locator('input[type="email"]').fill("teste@mail.com")
    await page.locator('input[id="name1"]').fill("Pedro")
    await page.locator('input[id="name2"]').fill("Maria")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()

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
    await getDateInput(page).fill("14/02/2024")
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
