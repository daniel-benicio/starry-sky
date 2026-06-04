import { createServerClient } from "./server"

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserState    = "active" | "inactive"
export type OrderState   = "created" | "paid" | "delivered" | "cancelled"
export type PaymentState = "created" | "confirmed" | "succeeded" | "failed" | "refunded"

interface UserRow {
  row_id: string
  id: string
  is_active: boolean
  state: UserState
  email: string
  cpf: string
  created_at: string
}

interface OrderRow {
  row_id: string
  id: string
  user_id: string
  name1: string
  name2: string
  date: string
  city: string
  state: OrderState
  is_active: boolean
  created_at: string
}

interface PaymentRow {
  row_id: string
  id: string
  order_id: string
  amount_cents: number
  state: PaymentState
  is_active: boolean
  provider: string
  provider_payment_id: string | null
  paid_at: string | null
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newId() {
  return crypto.randomUUID()
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(email: string, cpf: string): Promise<string> {
  const db = createServerClient()

  // Optimistic insert — avoids SELECT+INSERT race condition.
  // On unique conflict (code 23505), the user already exists: fall back to SELECT.
  const id = newId()
  const { error: insertErr } = await db.from("users").insert({
    id, is_active: true, state: "active", email, cpf,
  })

  if (!insertErr) return id

  if (insertErr.code === "23505") {
    const { data, error: selectErr } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("is_active", true)
      .single()
    if (selectErr || !data) throw new Error(`upsertUser: user not found after conflict`)
    return data.id
  }

  throw new Error(`upsertUser: ${insertErr.message}`)
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(params: {
  userId: string
  name1: string
  name2: string
  date: string
  city: string
}): Promise<string> {
  const db = createServerClient()
  const id = newId()

  const { error } = await db.from("orders").insert({
    id,
    user_id: params.userId,
    name1: params.name1,
    name2: params.name2,
    date: params.date,
    city: params.city,
    state: "created",
    is_active: true,
  })
  if (error) throw new Error(`createOrder: ${error.message}`)
  return id
}

export async function transitionOrder(orderId: string, newState: OrderState): Promise<void> {
  const db = createServerClient()

  const { data: current, error: fetchErr } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("is_active", true)
    .single<OrderRow>()

  if (fetchErr || !current) throw new Error(`transitionOrder: active row not found for ${orderId}`)

  await db.from("orders").update({ is_active: false }).eq("row_id", current.row_id)

  const { error } = await db.from("orders").insert({
    id: current.id,
    user_id: current.user_id,
    name1: current.name1,
    name2: current.name2,
    date: current.date,
    city: current.city,
    state: newState,
    is_active: true,
  })
  if (error) throw new Error(`transitionOrder insert: ${error.message}`)
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createPayment(params: {
  orderId: string
  amountCents: number
  providerPaymentId?: string
}): Promise<string> {
  const db = createServerClient()
  const id = newId()

  const { error } = await db.from("payments").insert({
    id,
    order_id: params.orderId,
    amount_cents: params.amountCents,
    state: "created",
    is_active: true,
    provider: "stripe",
    provider_payment_id: params.providerPaymentId ?? null,
    paid_at: null,
  })
  if (error) throw new Error(`createPayment: ${error.message}`)
  return id
}

export async function transitionPayment(
  paymentId: string,
  newState: PaymentState,
  providerPaymentId?: string | null,
): Promise<void> {
  const db = createServerClient()

  const { data: current, error: fetchErr } = await db
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("is_active", true)
    .single<PaymentRow>()

  if (fetchErr || !current) throw new Error(`transitionPayment: active row not found for ${paymentId}`)

  await db.from("payments").update({ is_active: false }).eq("row_id", current.row_id)

  const { error } = await db.from("payments").insert({
    id: current.id,
    order_id: current.order_id,
    amount_cents: current.amount_cents,
    state: newState,
    is_active: true,
    provider: current.provider,
    provider_payment_id: providerPaymentId ?? current.provider_payment_id,
    paid_at: newState === "succeeded" ? new Date().toISOString() : current.paid_at,
  })
  if (error) throw new Error(`transitionPayment insert: ${error.message}`)
}
