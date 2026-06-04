# Estratégia de Testes Automatizados — Céu do Nosso Dia

## 1. Contexto e objetivos

O projeto não possui nenhuma cobertura de testes hoje. O fluxo crítico de negócio é:
**formulário → pagamento → geração do mapa estelar → download/compartilhamento.**

A prioridade é proteger as camadas que, se quebrarem silenciosamente, prejudicam diretamente o cliente: cálculo astronômico, geocoding, formatação de campos de pagamento e o fluxo de compra.

---

## 2. Cenários mapeados

### 2.1 Lógica pura de astronomia (`lib/astronomy/`)

Estas funções são **determinísticas e sem dependências externas** — candidatas ideais para unit tests.

#### `projection.ts` — `projectToMap(altitudeDeg, azimuthDeg)`
| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Estrela abaixo do horizonte | altitude `-5` | `null` |
| Estrela no horizonte | altitude `0` | ponto na borda do mapa (`zenithDistance = 1`) |
| Estrela no zênite | altitude `90` | `{ x: 0, y: 0 }` |
| Norte | altitude `45`, azimuth `0` | `y < 0`, `x ≈ 0` |
| Leste | altitude `45`, azimuth `90` | `x > 0`, `y ≈ 0` |
| Coordenadas dentro de `[-1, 1]` | vários | todos os pontos normalizados |

#### `season.ts` — `getSeason(month, latitudeDeg)`
| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Hemisfério Sul, Dezembro | `12, -23` | `"Verão"` |
| Hemisfério Sul, Junho | `6, -23` | `"Inverno"` |
| Hemisfério Norte, Dezembro | `12, 40` | `"Inverno"` |
| Hemisfério Norte, Junho | `6, 40` | `"Verão"` |
| Equinócio — Março Sul | `3, -15` | `"Outono"` |
| Equinócio — Setembro Norte | `9, 51` | `"Outono"` |
| Exatamente no equador | `7, 0` | `"Verão"` (hemisfério Norte pelo sinal) |

#### `moon.ts` — `describeMoonPhase(date)`
| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Lua nova conhecida | 2024-01-11 | contém `"Lua Nova"` |
| Lua cheia conhecida | 2024-01-25 | contém `"Lua Cheia"` |
| Lua crescente | data entre nova e cheia | contém `"Crescente"` com percentual `0–100` |
| Lua minguante | data entre cheia e nova | contém `"Minguante"` com percentual `0–100` |

#### `stars.ts` — `computeVisibleStars(date, observer)`
| Cenário | Descrição |
|---|---|
| Retorna arrays não-vazios | Para data/local válidos, `stars.length > 0` |
| Todas as estrelas acima do horizonte | Nenhum ponto com altitude `< 0` entrou no resultado |
| Constelação dominante é string válida | Valor não é vazio e está no dicionário `CONSTELLATION_NAMES` |
| Linhas de constelação conectam estrelas visíveis | Cada `SkyLine` referencia apenas estrelas presentes em `stars` |

#### `sky.ts` — `computeSkyData(dateStr, lat, lon)`
| Cenário | Descrição |
|---|---|
| Formato de data `YYYY-MM-DD` | Parsing correto sem erro |
| Retorna shape completa | `stars`, `lines`, `moonPhase`, `brightestPlanet`, `season`, `dominantConstellation` presentes |
| São Paulo, 2024-06-21 | `season === "Inverno"` |
| Tromsø (lat +69), Dezembro | estrelas árticas diferentes de São Paulo |

---

### 2.2 Geocoding (`lib/geocoding.ts`) — `geocodeCity(input)`
| Cenário | Entrada | Resultado esperado |
|---|---|---|
| Exato lowercase | `"são paulo"` | `lat: -23.5505` |
| Alias curto | `"sp"` | `lat: -23.5505` |
| Com acento vs. sem | `"florianópolis"` / `"florianopolis"` | mesmas coordenadas |
| Texto com vírgula | `"Rio de Janeiro, RJ"` | coordenadas do Rio |
| Parcial (contém a key) | `"grande são paulo"` | São Paulo por partial match |
| Cidade desconhecida | `"Cidade X"` | fallback São Paulo |
| Input com espaços extras | `"  curitiba  "` | Curitiba |
| Input vazio | `""` | fallback São Paulo |
| Internacional | `"paris"` | `lat ≈ 48.85` |

---

### 2.3 Formatadores de pagamento (`lib/formatters.ts`)
| Função | Cenário | Entrada | Saída esperada |
|---|---|---|---|
| `formatCardNumber` | 16 dígitos | `"4111111111111111"` | `"4111 1111 1111 1111"` |
| `formatCardNumber` | com letras | `"4111abc1111111111"` | `"4111 1111 1111 111"` |
| `formatCardNumber` | mais de 16 dígitos | `"41111111111111119"` | trunca em 16 |
| `formatCardNumber` | vazio | `""` | `""` |
| `formatExpiry` | 4 dígitos | `"1225"` | `"12/25"` |
| `formatExpiry` | digitação parcial | `"12"` | `"12"` |
| `formatExpiry` | com letras | `"1a25"` | `"12/5"` |
| `formatCpf` | CPF completo | `"12345678901"` | `"123.456.789-01"` |
| `formatCpf` | parcial 6 dígitos | `"123456"` | `"123.456"` |
| `formatCpf` | mais de 11 dígitos | `"123456789012"` | trunca em 11 |
| `formatDate` | formato ISO | `"2024-06-21"` | `"21 de junho de 2024"` |
| `formatDate` | formato BR | `"21/06/2024"` | `"21 de junho de 2024"` |
| `formatDate` | string vazia | `""` | `""` |

---

### 2.4 API Route (`app/api/checkout/route.ts`)

Testes de integração simulando chamadas HTTP reais ao handler do Next.js.

| Cenário | Payload | Resposta esperada |
|---|---|---|
| Payload válido | `cardToken`, `email` presentes | `200 { success: true, orderId: "..." }` |
| Sem `cardToken` | `email` presente, sem token | `400 { message: "Dados incompletos." }` |
| Sem `email` | `cardToken` presente, sem email | `400 { message: "Dados incompletos." }` |
| Sem `PAGARME_SECRET_KEY` | env não definida | `500 { message: "Configuração de pagamento inválida." }` |
| Pagarme retorna erro de cartão recusado | mock lança `"cartão recusado"` | `400` com mensagem do erro |
| Pagarme retorna erro genérico | mock lança erro genérico | `500 { message: "..." }` |

---

### 2.5 Hook `useCheckoutForm` (`hooks/use-checkout-form.ts`)

Testes com React Testing Library + renderHook.

| Cenário | Ação | Resultado esperado |
|---|---|---|
| Formatação ao digitar número | `setField("number", "4111111111111111")` | `fields.number === "4111 1111 1111 1111"` |
| Formatação CPF | `setField("document", "12345678901")` | `fields.document === "123.456.789-01"` |
| Formatação validade | `setField("expiry", "1225")` | `fields.expiry === "12/25"` |
| CVV focus/blur | `onCVVFocus()` / `onCVVBlur()` | `isCVVFocused` alterna corretamente |
| Loading state no submit | `onSubmit()` | `isLoading` vira `true` durante chamada |
| Redirect após sucesso | pagamento bem-sucedido | `router.push` chamado com `/result?...` |

---

### 2.6 Fluxo E2E (`/` → `/pagamento` → `/result`)

Testes end-to-end simulando o usuário real no browser.

| Cenário | Passos | Verificação |
|---|---|---|
| Fluxo completo (happy path) | Preenche formulário, clica em prosseguir, preenche cartão, finaliza | Chega na página `/result` com mapa visível |
| Formulário vazio na landing | Tenta enviar sem preencher | Mensagens de validação visíveis |
| Data inválida | Insere data futura ou formato errado | Campo sinalizado como erro |
| Cidade não encontrada | Insere cidade desconhecida | Ainda prossegue (fallback SP) sem quebrar |
| Cartão inválido no pagamento | Número curto, validade expirada | Erro visível antes de submeter |
| Responsividade mobile | Viewport 375px | Elementos visíveis sem overflow |
| Download do poster | Na página result, clica "Download" | Arquivo PNG gerado e baixado |

---

## 3. Recomendação de tecnologia

### Opção A — Vitest + Playwright (Recomendado)

| Camada | Ferramenta |
|---|---|
| Unit + integração (lógica pura, hooks, API) | **Vitest** + **@testing-library/react** |
| E2E | **Playwright** |

**Por que Vitest:**
- Suporte nativo a ESM e TypeScript — zero config com o tsconfig existente
- Compatível com a sintaxe do Jest (mesma API `describe/it/expect`), sem curva de aprendizado
- Muito mais rápido que Jest em projetos TypeScript/ESM (não precisa de Babel)
- `vitest --watch` com HMR no terminal
- Coverage nativo via `@vitest/coverage-v8` sem plugin extra

**Por que Playwright:**
- Primeira escolha para Next.js em 2024/2025 (recomendado pela Vercel)
- TypeScript nativo, sem configuração extra
- Paralelo por padrão, sem flake por timeout como o Cypress tinha historicamente
- `playwright test --ui` oferece um debugger visual excelente

### Opção B — Jest + Cypress

Mais estabelecido, porém exige mais configuração para ESM/TypeScript com Next.js 16 e tem execução mais lenta. Não recomendado para greenfield em 2025.

---

## 4. Estrutura de arquivos proposta

```
starry-sky/
├── __tests__/
│   ├── unit/
│   │   ├── astronomy/
│   │   │   ├── projection.test.ts
│   │   │   ├── season.test.ts
│   │   │   ├── moon.test.ts
│   │   │   ├── stars.test.ts
│   │   │   └── sky.test.ts
│   │   ├── geocoding.test.ts
│   │   └── formatters.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   └── checkout.test.ts
│   │   └── hooks/
│   │       └── use-checkout-form.test.tsx
│   └── e2e/
│       ├── landing-flow.spec.ts
│       ├── payment-flow.spec.ts
│       └── result-page.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## 5. Dependências a instalar

```bash
# Vitest + testing library
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom

# Playwright
npx playwright install --with-deps
npm install -D @playwright/test
```

---

## 6. Prioridade de implementação

1. **Formatters** — mais simples, valida o setup do Vitest imediatamente
2. **Geocoding** — cobre um ponto cego real (fallback silencioso para SP)
3. **Astronomia (projection, season, moon)** — lógica crítica e completamente testável offline
4. **Astronomia (stars, sky)** — requer `astronomy-engine` como dependência real
5. **Hook `useCheckoutForm`** — integração com React Testing Library
6. **API checkout** — mock do Pagarme, valida regras de erro/sucesso
7. **E2E** — cobre o fluxo completo como último passo
