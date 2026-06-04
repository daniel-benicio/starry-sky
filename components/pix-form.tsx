"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCpf } from "@/lib/formatters"
import { Loader2, Copy, Check, AlertCircle, Lock } from "lucide-react"
import type { OrderData } from "@/types/order"

type State = "idle" | "loading" | "waiting" | "confirming" | "error"

export function PixForm(order: OrderData) {
  const router = useRouter()

  const [cpf,        setCpf]        = useState("")
  const [state,      setState]      = useState<State>("idle")
  const [error,      setError]      = useState("")
  const [brCode,     setBrCode]     = useState("")
  const [qrDataUrl,  setQrDataUrl]  = useState("")
  const [chargeId,   setChargeId]   = useState("")
  const [copied,     setCopied]     = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isDev = process.env.NODE_ENV === "development"

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current) }, [])

  const completeOrder = async (id: string) => {
    setState("confirming")
    try {
      const confirmRes = await fetch("/api/abacatepay/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chargeId: id, cpf, ...order }),
      })
      if (!confirmRes.ok) {
        const { message } = await confirmRes.json().catch(() => ({}))
        throw new Error(message ?? "Erro ao registrar pedido.")
      }

      const resultRes = await fetch("/api/generate-result", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      })
      if (!resultRes.ok) {
        const { message } = await resultRes.json().catch(() => ({}))
        throw new Error(message ?? "Erro ao processar resultado.")
      }

      router.push("/result")
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "Erro ao processar pedido.")
    }
  }

  const startPolling = (id: string) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res          = await fetch(`/api/abacatepay/status?id=${id}`)
        const { status }   = await res.json()
        if (status === "PAID") {
          clearInterval(pollingRef.current!)
          await completeOrder(id)
        } else if (status === "EXPIRED" || status === "CANCELLED") {
          clearInterval(pollingRef.current!)
          setState("error")
          setError("PIX expirado ou cancelado. Tente novamente.")
        }
      } catch {
        // silently retry on transient network errors
      }
    }, 3000)
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setState("loading")
    setError("")

    try {
      const res  = await fetch("/api/abacatepay/charge", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, ...order }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Erro ao gerar PIX.")

      setBrCode(data.brCode)
      setQrDataUrl(data.brCodeBase64)
      setChargeId(data.id)
      setState("waiting")
      startPolling(data.id)
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "Erro ao gerar PIX.")
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(brCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (state === "confirming") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Pagamento confirmado! Processando seu mapa…</p>
      </div>
    )
  }

  if (state === "waiting") {
    return (
      <div className="animate-fade-in-up w-full space-y-5">
        <h2 className="font-serif text-2xl text-foreground">Pagar com PIX</h2>

        <div className="flex flex-col items-center gap-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR Code PIX"
            width={192}
            height={192}
            className="rounded-xl border border-border bg-white p-2"
          />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Escaneie o QR Code ou copie o código no app do seu banco
          </p>
        </div>

        <Button type="button" variant="outline" className="w-full gap-2" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar código PIX"}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Aguardando confirmação do pagamento…
        </div>

        {isDev && (
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs border-dashed border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
            onClick={async () => {
              await fetch("/api/abacatepay/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: chargeId }),
              })
            }}
          >
            [DEV] Simular pagamento PIX
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          O QR Code expira em 1 hora &bull; Após pagar, aguarde alguns instantes
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up w-full min-w-0">
      <h2 className="font-serif text-2xl mb-1 text-foreground">Pagar com PIX</h2>
      <p className="text-muted-foreground text-sm mb-6 flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5" />
        Transação 100% segura via AbacatePay
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="pixCpf" className="text-foreground/90">CPF do pagador</Label>
          <Input
            id="pixCpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
            maxLength={14}
            required
          />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-sm animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={state === "loading"}
          className="w-full font-medium text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 disabled:opacity-70 disabled:scale-100"
        >
          {state === "loading" ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando QR Code…</>
          ) : (
            "Gerar QR Code PIX"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Pagamento único &bull; Sem assinatura &bull; Receba em minutos
        </p>
      </form>
    </div>
  )
}
