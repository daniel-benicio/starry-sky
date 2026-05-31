import { test, expect } from "@playwright/test"

const PAYMENT_URL =
  "/pagamento?date=2024-02-14&city=S%C3%A3o+Paulo&email=ana%40email.com&name1=Ana&name2=Lucas"

test.describe("Página de pagamento", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAYMENT_URL)
  })

  test("exibe o resumo do pedido com os dados da URL", async ({ page }) => {
    await expect(page.getByText("Ana & Lucas", { exact: true }).first()).toBeVisible()
  })

  test("exibe o formulário de cartão", async ({ page }) => {
    await expect(page.locator('input[placeholder*="0000"]').or(page.locator('input[name="number"]'))).toBeVisible()
  })

  test("campo de número formata ao digitar", async ({ page }) => {
    const numberInput = page.locator('input').filter({ hasText: /número/i }).or(
      page.locator('input[placeholder*="0000"]')
    ).first()
    await numberInput.fill("4111111111111111")
    const value = await numberInput.inputValue()
    expect(value).toMatch(/\d{4} \d{4}/)
  })

  test("versão mobile exibe formulário sem overflow horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(PAYMENT_URL)
    await page.waitForLoadState("networkidle")

    const main = page.locator("main")
    await expect(main).toBeVisible()
    const box = await main.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)
  })

  test("link do header retorna para a home", async ({ page }) => {
    await page.getByRole("link", { name: /céu do nosso dia/i }).click()
    await expect(page).toHaveURL("/")
  })
})
