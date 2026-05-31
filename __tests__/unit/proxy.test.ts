import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import proxy from "@/proxy"
import { createResultToken } from "@/lib/result-token"

const SAMPLE_DATA = {
  date:  "2024-02-14",
  city:  "São Paulo",
  email: "ana@email.com",
  name1: "Ana",
  name2: "Lucas",
}

/** Cria um NextRequest com cookie result_token opcional. */
function makeRequest(url: string, token?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (token !== undefined) {
    headers["Cookie"] = `result_token=${token}`
  }
  return new NextRequest(url, { headers })
}

let savedSecret: string | undefined
beforeEach(() => {
  savedSecret = process.env.RESULT_SECRET
  process.env.RESULT_SECRET ??= "test-secret"
})
afterEach(() => {
  if (savedSecret === undefined) delete process.env.RESULT_SECRET
  else process.env.RESULT_SECRET = savedSecret
})

// ─── rotas fora de /result ────────────────────────────────────────────────────

describe("proxy — rotas não protegidas", () => {
  it("deixa passar requisições para /", async () => {
    const res = await proxy(makeRequest("http://localhost/"))
    expect(res.status).toBe(200)
  })

  it("deixa passar requisições para /pagamento", async () => {
    const res = await proxy(makeRequest("http://localhost/pagamento"))
    expect(res.status).toBe(200)
  })

  it("deixa passar requisições para /api/checkout", async () => {
    const res = await proxy(makeRequest("http://localhost/api/checkout"))
    expect(res.status).toBe(200)
  })
})

// ─── rota /result sem cookie ──────────────────────────────────────────────────

describe("proxy — /result sem cookie", () => {
  it("redireciona para / quando não há cookie result_token", async () => {
    const res = await proxy(makeRequest("http://localhost/result"))
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get("location")).toBe("http://localhost/")
  })
})

// ─── rota /result com token inválido ─────────────────────────────────────────

describe("proxy — /result com token inválido", () => {
  it("redireciona para / quando o token não tem o separador de ponto", async () => {
    const res = await proxy(makeRequest("http://localhost/result", "tokeninvalido"))
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get("location")).toBe("http://localhost/")
  })

  it("redireciona para / quando a assinatura foi adulterada", async () => {
    const token    = await createResultToken(SAMPLE_DATA)
    const payload  = token.split(".")[0]
    const tampered = `${payload}.${"0".repeat(64)}`

    const res = await proxy(makeRequest("http://localhost/result", tampered))
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get("location")).toBe("http://localhost/")
  })

  it("redireciona para / quando o payload foi adulterado", async () => {
    const token  = await createResultToken(SAMPLE_DATA)
    const [, sig] = token.split(".")
    const fakePayload = btoa(JSON.stringify({ ...SAMPLE_DATA, name1: "Hacker" }))

    const res = await proxy(makeRequest("http://localhost/result", `${fakePayload}.${sig}`))
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get("location")).toBe("http://localhost/")
  })

  it("apaga o cookie result_token na resposta quando o token é adulterado", async () => {
    const token    = await createResultToken(SAMPLE_DATA)
    const [p]      = token.split(".")
    const tampered = `${p}.${"f".repeat(64)}`

    const res        = await proxy(makeRequest("http://localhost/result", tampered))
    const setCookie  = res.headers.get("set-cookie") ?? ""
    // Cookie deletado: o valor fica vazio e Max-Age=0
    expect(setCookie).toMatch(/result_token=;|result_token=\s*;/i)
  })

  it("redireciona para / quando o token foi criado com secret diferente", async () => {
    process.env.RESULT_SECRET = "secret-criacao"
    const token = await createResultToken(SAMPLE_DATA)

    process.env.RESULT_SECRET = "secret-verificacao"
    const res = await proxy(makeRequest("http://localhost/result", token))
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.headers.get("location")).toBe("http://localhost/")
  })
})

// ─── rota /result com token válido ───────────────────────────────────────────

describe("proxy — /result com token válido", () => {
  it("permite acesso com cookie válido (retorna next)", async () => {
    const token = await createResultToken(SAMPLE_DATA)
    const res   = await proxy(makeRequest("http://localhost/result", token))
    expect(res.status).toBe(200)
  })

  it("permite acesso a sub-rotas de /result com cookie válido", async () => {
    const token = await createResultToken(SAMPLE_DATA)
    const res   = await proxy(makeRequest("http://localhost/result/share", token))
    expect(res.status).toBe(200)
  })
})
