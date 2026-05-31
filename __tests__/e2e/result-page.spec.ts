import { test, expect, type Page } from "@playwright/test"

const BASE_ORDER = {
  date:  "2024-02-14",
  city:  "São Paulo",
  email: "ana@email.com",
  name1: "Ana",
  name2: "Lucas",
}

/**
 * Simula o fluxo pós-pagamento:
 *  1. Chama POST /api/generate-result → seta o cookie result_token no contexto do browser
 *  2. Navega para /result (o proxy valida o cookie e deixa passar)
 *
 * Aceita `overrides` para testes que precisam de dados diferentes (ex: cidade inválida).
 */
async function goToResult(page: Page, overrides: Partial<typeof BASE_ORDER> = {}) {
  const res = await page.request.post("/api/generate-result", {
    data: { ...BASE_ORDER, ...overrides },
  })
  if (!res.ok()) throw new Error(`/api/generate-result returned ${res.status()}`)
  await page.goto("/result")
}

test.describe("Página de resultado — mapa estelar", () => {
  test.beforeEach(async ({ page }) => {
    await goToResult(page)
  })

  test("exibe os nomes do casal", async ({ page }) => {
    await expect(page.getByText("Ana & Lucas")).toBeVisible()
  })

  test("exibe a data formatada em português", async ({ page }) => {
    await expect(page.locator("p", { hasText: /^14 de fevereiro de 2024$/ })).toBeVisible()
  })

  test("exibe o canvas do mapa estelar após carregar", async ({ page }) => {
    await expect(page.locator("canvas:not([aria-hidden])")).toBeVisible({ timeout: 10_000 })
  })

  test("exibe botão de download", async ({ page }) => {
    await expect(page.getByRole("button", { name: /baixar/i })).toBeVisible()
  })

  test("exibe botão de compartilhar", async ({ page }) => {
    await expect(page.getByRole("button", { name: /compartilhar/i })).toBeVisible()
  })

  test("exibe informações astronômicas (fase da lua, estação)", async ({ page }) => {
    await page.locator("canvas:not([aria-hidden])").waitFor({ timeout: 10_000 })
    await expect(page.getByText(/fase da lua/i)).toBeVisible()
    await expect(page.getByText(/estação/i)).toBeVisible()
  })

  test("exibe e-mail do usuário na página", async ({ page }) => {
    await expect(page.getByText(/ana@email\.com/i)).toBeVisible()
  })


  test("exibe aviso quando cidade não é reconhecida", async ({ page }) => {
    await goToResult(page, { city: "CidadeXYZ123", email: "a@b.com", name1: "A", name2: "B" })
    await expect(page.getByText(/cidade não reconhecida/i)).toBeVisible()
  })

  test("link para criar novo mapa retorna à home", async ({ page }) => {
    await page.getByRole("link", { name: /criar novo mapa/i }).click()
    await expect(page).toHaveURL("/")
  })

  test("versão mobile exibe página sem overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/result") // cookie já está no contexto; só re-navega com viewport mobile
    const main = page.locator("main")
    const box  = await main.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)
  })

  test("acesso direto sem cookie redireciona para a home", async ({ page, context }) => {
    // Limpa todos os cookies do contexto e tenta acessar /result diretamente
    await context.clearCookies()
    await page.goto("/result")
    await expect(page).toHaveURL("/")
  })
})
