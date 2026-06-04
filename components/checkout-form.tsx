"use client"

import { useState } from "react"
import { CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js"
import type { StripeCardNumberElementChangeEvent } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2, AlertCircle } from "lucide-react"
import { CreditCardVisual } from "@/components/credit-card-visual"
import { useCheckoutForm } from "@/hooks/use-checkout-form"
import type { OrderData } from "@/types/order"

const INPUT_CLS =
  "bg-secondary border-border text-foreground placeholder:text-muted-foreground " +
  "focus:ring-primary focus:border-primary transition-colors duration-200 hover:border-primary/40"

const STRIPE_BASE_STYLE = {
  color: "rgba(255,255,255,0.92)",
  fontSize: "14px",
  fontFamily: "inherit",
  "::placeholder": { color: "rgba(255,255,255,0.3)" },
}

const STRIPE_ELEMENT_OPTIONS = { style: { base: STRIPE_BASE_STYLE } }

const ELEMENT_WRAPPER =
  "flex items-center h-10 px-3 rounded-md border bg-secondary border-border " +
  "transition-colors duration-200 hover:border-primary/40 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"

type Props = OrderData & { clientSecret: string }

export function CheckoutForm({ clientSecret, ...order }: Props) {
  const { fields, isCVVFocused, isLoading, error, setField, setBrand, onCVVFocus, onCVVBlur, onSubmit } =
    useCheckoutForm(order, clientSecret)

  const [numberComplete, setNumberComplete] = useState(false)

  const onCardNumberChange = (e: StripeCardNumberElementChangeEvent) => {
    setBrand(e.brand ?? "")
    setNumberComplete(e.complete)
  }

  return (
    <div className="animate-fade-in-up w-full min-w-0" style={{ animationDelay: "80ms" }}>
      <h2 className="font-serif text-2xl mb-1 text-foreground">Dados do pagamento</h2>
      <p className="text-muted-foreground text-sm mb-6 flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5" />
        Transação 100% segura via Stripe
      </p>

      <CreditCardVisual name={fields.name} brand={fields.brand} isFlipped={isCVVFocused} numberComplete={numberComplete} />

      <form onSubmit={onSubmit} className="space-y-5 w-full">
        <div className="space-y-2">
          <Label htmlFor="cardName" className="text-foreground/90">Nome no cartão</Label>
          <Input
            id="cardName"
            type="text"
            placeholder="Como está impresso no cartão"
            value={fields.name}
            onChange={(e) => setField("name", e.target.value)}
            className={INPUT_CLS}
            autoComplete="cc-name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardDocument" className="text-foreground/90">CPF do titular</Label>
          <Input
            id="cardDocument"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={fields.document}
            onChange={(e) => setField("document", e.target.value)}
            className={INPUT_CLS}
            maxLength={14}
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground/90">Número do cartão</Label>
          <div className={ELEMENT_WRAPPER}>
            <CardNumberElement
              options={STRIPE_ELEMENT_OPTIONS}
              className="w-full"
              onChange={onCardNumberChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground/90">Validade</Label>
            <div className={ELEMENT_WRAPPER}>
              <CardExpiryElement options={STRIPE_ELEMENT_OPTIONS} className="w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90">CVV</Label>
            <div className={ELEMENT_WRAPPER}>
              <CardCvcElement
                options={STRIPE_ELEMENT_OPTIONS}
                className="w-full"
                onFocus={onCVVFocus}
                onBlur={onCVVBlur}
              />
            </div>
          </div>
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
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processando pagamento...</>
          ) : (
            <><Lock className="w-4 h-4 mr-2" />Pagar R$&nbsp;24,99</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Pagamento único &bull; Sem assinatura &bull; Receba em minutos
        </p>
      </form>
    </div>
  )
}
