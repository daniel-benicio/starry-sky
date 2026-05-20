# Integração: Banco de Dados + E-mail

## TL;DR

| Serviço | Escolha | Por quê |
|---|---|---|
| Banco de dados | **Supabase** | PostgreSQL gerenciado, free tier robusto, storage incluso, dashboard visual para ver pedidos |
| ORM | **Drizzle ORM** | Leve, TypeScript-first, sem overhead, ideal para serverless |
| E-mail transacional | **Resend** | 3.000 e-mails/mês grátis, integração nativa com Next.js, e-mails com React |
| Storage de pôsters | **Supabase Storage** | Já incluso no plano gratuito (1GB), sem custo extra |

**Custo total no MVP: R$ 0/mês.**  
**Custo com ~500 pedidos/mês: R$ 0/mês.**

---

## Por que Supabase (e não outra coisa)

O usuário sugeriu Supabase — é a escolha certa para este projeto. Aqui a comparação honesta:

### Supabase ✅ Recomendado
- PostgreSQL real, sem limitações de queries
- Free tier: 500 MB de storage, 50k usuários ativos/mês, **sem pause se o projeto tiver atividade**
- Dashboard visual para ver pedidos sem escrever SQL
- Storage incluso para guardar os pôsteres gerados
- Auth nativo (útil mais tarde para painel admin)
- Região São Paulo disponível → menor latência no Brasil
- Supabase Edge Functions para automações futuras

### Neon (alternativa válida)
- PostgreSQL serverless, sem pausas mesmo no free tier
- Mais flexível, sem lock-in de vendor
- Mas: sem storage, sem auth, sem dashboard — teria que montar tudo na mão

### PlanetScale ❌
- Encerrou o plano gratuito em 2024. Descartado.

### Firebase ❌
- Firestore não é SQL, queries mais complexas são dolorosas
- Custo cresce rápido com volume
- Não é o melhor fit para um modelo relacional simples

**Veredito:** Supabase entrega tudo que o projeto precisa hoje e amanhã, sem custo inicial.

---

## Modelo de dados

### Tabela `orders`

É o coração do sistema. Uma linha por pedido realizado.

```sql
create table orders (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  name1           text not null,
  name2           text not null,
  special_date    text not null,           -- "14/02/2021" como o usuário digitou
  city            text not null,
  amount_cents    integer not null default 2900,
  status          text not null default 'pending', -- pending | paid | failed
  pagarme_order_id  text,                  -- ID retornado pelo Pagar.me
  pagarme_charge_id text,                  -- ID do charge para rastreio
  poster_url      text,                    -- URL no Supabase Storage após geração
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

**Por que não ter tabela `users` separada agora?**  
O produto não tem login. O cliente é identificado apenas pelo e-mail. Criar uma tabela `users` agora seria prematura — quando houver necessidade (ex: histórico de pedidos com login), é trivial extrair. YAGNI.

### Índices necessários

```sql
create index on orders (email);
create index on orders (pagarme_order_id);
create index on orders (status);
```

---

## Fluxo completo após a integração

```
[Cliente]                    [Frontend]              [Backend]             [Pagar.me]      [Supabase]   [Resend]
   |                             |                       |                     |               |            |
   |── preenche form ──────────> |                       |                     |               |            |
   |── clica "Pagar" ──────────> |                       |                     |               |            |
   |                             |── tokeniza cartão ──> | (Pagar.me.js)       |               |            |
   |                             |<── card_token ──────── |                     |               |            |
   |                             |── POST /api/checkout ─>|                     |               |            |
   |                             |                       |── createOrder() ──> |               |            |
   |                             |                       |<── { id, status } ── |               |            |
   |                             |                       |── INSERT order ─────────────────── >|            |
   |                             |                       |── sendEmail() ──────────────────────────────── > |
   |                             |                       |<── { success, orderId } retorna     |            |
   |                             |<── { orderId } ────── |                     |               |            |
   |                             |── redirect /result?order_id=xxx             |               |            |
   |<── tela de resultado ────── |                       |                     |               |            |
   |                             |── GET /api/orders/xxx ─>                    |               |            |
   |                             |                       |── SELECT * FROM orders WHERE id=xxx >|            |
   |                             |<── dados do pedido ── |                                     |            |
   |<── pôster + dados ───────── |                                                                          |
   |                             |                                                                          |
   |                        [Pagar.me Webhook]                                                              |
   |                             |── POST /api/webhooks/pagarme ─>            |               |            |
   |                             |                       |── UPDATE orders SET status=paid ──> |            |
```

---

## O que muda no código

### 1. Variáveis de ambiente (`.env.local`)

```env
# Já existentes
NEXT_PUBLIC_PAGARME_PUBLIC_KEY=pk_...
PAGARME_SECRET_KEY=sk_...

# Adicionar
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # somente server-side, nunca expor no client
RESEND_API_KEY=re_...
```

### 2. `/api/checkout/route.ts` — salvar pedido após pagamento

```typescript
// Após createOrder() retornar sucesso, adicionar:
await supabase.from("orders").insert({
  email,
  name1,
  name2,
  special_date: date,
  city,
  status: "paid",
  pagarme_order_id: order.id,
  pagarme_charge_id: order.charges?.[0]?.id,
})

await resend.emails.send({
  from: "Céu do Nosso Dia <contato@ceudonossdia.com.br>",
  to: email,
  subject: "Seu mapa estelar está pronto ✨",
  react: <PosterEmail name1={name1} name2={name2} date={date} posterUrl={...} />,
})

return NextResponse.json({ success: true, orderId: internalOrderId })
```

### 3. Novo: `/api/webhooks/pagarme/route.ts`

Recebe notificações do Pagar.me sobre mudanças de status (ex: chargeback, cancelamento).

```typescript
export async function POST(req: NextRequest) {
  // 1. Validar assinatura do webhook (Pagar.me envia header X-Hub-Signature)
  // 2. Extrair pagarme_order_id e novo status
  // 3. UPDATE orders SET status = novoStatus WHERE pagarme_order_id = id
}
```

### 4. Novo: `/api/orders/[id]/route.ts`

Endpoint para a `/result` buscar os dados do pedido pelo ID interno (não query params).

```typescript
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single()
  return NextResponse.json(data)
}
```

### 5. `hooks/use-checkout-form.ts` — completar integração Pagar.me

O TODO atual precisa ser substituído pela tokenização real:

```typescript
const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError("")

  try {
    // 1. Tokenizar cartão no client com Pagar.me.js
    const cardToken = await pagarme.tokens.create({ card: { ... } })

    // 2. Enviar token + dados ao backend
    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ cardToken, ...order }),
    })
    const { orderId } = await res.json()

    // 3. Redirecionar com ID do pedido (não mais query params com dados pessoais)
    router.push(`/result?order_id=${orderId}`)
  } catch (err) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}
```

### 6. `app/result/page.tsx` — buscar dados pelo `order_id`

Trocar os query params por uma fetch ao banco:

```typescript
// Antes (inseguro — dados pessoais na URL):
const name1 = searchParams.get("name1")

// Depois (seguro — só o ID na URL):
const orderId = searchParams.get("order_id")
const { data: order } = useSWR(`/api/orders/${orderId}`, fetcher)
// ou simplesmente useEffect + fetch
```

---

## Estrutura de pastas após a integração

```
lib/
  supabase.ts          ← cliente Supabase (server + client)
  resend.ts            ← instância do Resend
  pagarme.ts           ← já existe, sem mudança

app/api/
  checkout/route.ts    ← atualizar: salvar no DB + enviar e-mail
  webhooks/
    pagarme/route.ts   ← novo: receber notificações de status
  orders/
    [id]/route.ts      ← novo: buscar pedido por ID

emails/
  poster-email.tsx     ← template React do e-mail de entrega

db/
  schema.ts            ← schema Drizzle (tabela orders)
  migrations/          ← migrations geradas pelo Drizzle
```

---

## Stack de dependências a instalar

```bash
# Supabase
npm install @supabase/supabase-js

# Drizzle ORM + driver PostgreSQL
npm install drizzle-orm postgres
npm install -D drizzle-kit

# E-mail
npm install resend @react-email/components

# Pagar.me JS (tokenização client-side)
npm install pagarme
```

---

## Geração e armazenamento do pôster

Hoje o pôster é gerado **no browser do cliente** (canvas). Para entregar por e-mail, há duas opções:

### Opção A — Gerar no servidor (recomendada para e-mail)
Usar `node-canvas` ou `@vercel/og` para gerar o PNG no backend e fazer upload para o Supabase Storage antes de enviar o e-mail.

**Prós:** e-mail chega com o pôster em anexo ou link seguro.  
**Contras:** `node-canvas` tem dependências nativas, pode complicar no deploy Vercel. Alternativa: Vercel OG Image (limitado a 1200×630).

### Opção B — Gerar no cliente e fazer upload (mais simples)
Na `/result`, após gerar o PNG no canvas, fazer um `PUT` ao Supabase Storage via SDK client e salvar a URL no pedido.

**Prós:** reusa o código de geração que já existe, zero dependências novas.  
**Contras:** o e-mail só pode ser enviado depois do upload, precisa de uma segunda chamada ao servidor.

**Recomendação:** começar com a **Opção B** para lançar rápido. Migrar para A quando houver demanda.

---

## Segurança

| Ponto | Ação |
|---|---|
| Dados pessoais na URL | Substituir query params pelo `order_id` após integração com DB |
| `SUPABASE_SERVICE_ROLE_KEY` | Nunca usar no cliente, somente em `route.ts` |
| Webhook Pagar.me | Validar `X-Hub-Signature` antes de processar |
| Row-Level Security | Habilitar no Supabase — orders só acessíveis via service role |

---

## Custos projetados

| Volume mensal | Supabase | Resend | Total |
|---|---|---|---|
| 0–500 pedidos | Grátis | Grátis | **R$ 0** |
| 500–3.000 pedidos | Grátis | Grátis | **R$ 0** |
| 3.000–10.000 pedidos | Grátis | ~$20/mês (~R$ 110) | **~R$ 110** |
| 10.000+ pedidos | $25/mês Pro (~R$ 140) | ~$20/mês | **~R$ 250** |

A R$29 por pedido: 10.000 pedidos = R$290.000 de receita. Custo de infra: R$250. **Margem de infra: 99,9%.**

---

## Ordem de implementação sugerida

1. **Criar projeto no Supabase** → rodar migration da tabela `orders` → configurar env vars
2. **Completar integração Pagar.me** no `use-checkout-form` (tokenização real)
3. **Atualizar `/api/checkout`** → salvar pedido no DB após pagamento aprovado
4. **Atualizar `/result`** → buscar dados por `order_id` em vez de query params
5. **Webhook Pagar.me** → atualizar status de pedidos
6. **Resend + template de e-mail** → enviar pôster após pagamento
7. **Upload do pôster** → Supabase Storage, salvar URL no pedido
