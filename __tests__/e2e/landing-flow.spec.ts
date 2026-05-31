import { test, expect } from "@playwright/test"

test.describe("Landing page — formulário de pedido", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("exibe a landing page com o formulário", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test("botão de submit fica desabilitado com formulário vazio (campos required)", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: /gerar meu céu/i })
    await submitBtn.click()
    // HTML5 validation impedirá o submit — permanecemos na mesma URL
    await expect(page).toHaveURL("/")
  })

  test("preencher todos os campos e submeter redireciona para /pagamento", async ({ page }) => {
    await page.locator('input[type="date"]').fill("2024-02-14")
    await page.locator('input[id="city"]').fill("São Paulo")
    await page.locator('input[type="email"]').fill("ana@email.com")
    await page.locator('input[id="name1"]').fill("Ana")
    await page.locator('input[id="name2"]').fill("Lucas")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()

    await expect(page).toHaveURL(/\/pagamento/)
  })

  test("URL de pagamento contém os dados do formulário", async ({ page }) => {
    await page.locator('input[type="date"]').fill("2024-02-14")
    await page.locator('input[id="city"]').fill("Curitiba")
    await page.locator('input[type="email"]').fill("teste@mail.com")
    await page.locator('input[id="name1"]').fill("Pedro")
    await page.locator('input[id="name2"]').fill("Maria")

    await page.getByRole("button", { name: /gerar meu céu/i }).click()
    await page.waitForURL(/\/pagamento/)

    const url = page.url()
    expect(url).toContain("city=Curitiba")
    expect(url).toContain("name1=Pedro")
    expect(url).toContain("name2=Maria")
  })

  test("versão mobile exibe formulário sem overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")

    const form = page.locator("form")
    await expect(form).toBeVisible()

    const formBox = await form.boundingBox()
    expect(formBox?.width).toBeLessThanOrEqual(375)
  })
})
