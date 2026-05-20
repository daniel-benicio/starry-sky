import { test, expect } from "@playwright/test"

const RESULT_URL =
  "/result?date=2024-02-14&city=S%C3%A3o+Paulo&email=ana%40email.com&name1=Ana&name2=Lucas"

test.describe("Página de resultado — mapa estelar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(RESULT_URL)
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
    await page.locator("canvas").waitFor({ timeout: 10_000 })
    await expect(page.getByText(/fase da lua/i)).toBeVisible()
    await expect(page.getByText(/estação/i)).toBeVisible()
  })

  test("exibe e-mail do usuário na página", async ({ page }) => {
    await expect(page.getByText(/ana@email.com/i)).toBeVisible()
  })

  test("exibe aviso quando cidade não é reconhecida", async ({ page }) => {
    await page.goto(
      "/result?date=2024-02-14&city=CidadeXYZ123&email=a%40b.com&name1=A&name2=B"
    )
    await expect(page.getByText(/cidade não reconhecida/i)).toBeVisible()
  })

  test("link para criar novo mapa retorna à home", async ({ page }) => {
    await page.getByRole("link", { name: /criar novo mapa/i }).click()
    await expect(page).toHaveURL("/")
  })

  test("versão mobile exibe página sem overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(RESULT_URL)

    const main = page.locator("main")
    const box = await main.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)
  })
})
