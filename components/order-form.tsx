"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CityCombobox } from "@/components/city-combobox"
import { Sparkles } from "lucide-react"

export interface OrderFormData {
  date: string
  city: string
  email: string
  name1: string
  name2: string
  names: string
}

interface OrderFormProps {
  onFormChange?: (data: { date: string; names: string; email: string; city: string }) => void
  onSubmit?: (data: OrderFormData) => void
}

export function OrderForm({ onFormChange, onSubmit }: OrderFormProps) {
  const [date,  setDate]  = useState("")
  const [city,  setCity]  = useState("")
  const [email, setEmail] = useState("")
  const [name1, setName1] = useState("")
  const [name2, setName2] = useState("")

  // ── Validação da data ──────────────────────────────────────────────────────
  // today é calculado uma única vez por montagem — não muda durante a sessão.
  const today = useMemo(() => new Date().toISOString().split("T")[0], [])

  const [dateTouched,    setDateTouched]    = useState(false)
  const dateIsFuture   = date > today           // comparação lexicográfica funciona em YYYY-MM-DD
  const showDateError  = dateTouched && dateIsFuture

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDateChange = (value: string) => {
    setDate(value)
    onFormChange?.({ date: value, names: name1 && name2 ? `${name1} & ${name2}` : "", email, city })
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    onFormChange?.({ date, names: name1 && name2 ? `${name1} & ${name2}` : "", email: value, city })
  }

  const handleNameChange = (value1: string, value2: string) => {
    setName1(value1)
    setName2(value2)
    onFormChange?.({ date, names: value1 && value2 ? `${value1} & ${value2}` : "", email, city })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Guarda de segurança explícita — impede submit mesmo se a validação
    // HTML5 for contornada (ex: submit programático em testes ou automação).
    if (dateIsFuture) {
      setDateTouched(true)
      return
    }
    onSubmit?.({ date, city, email, name1, name2, names: `${name1} & ${name2}` })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form data-testid="order-form" onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">

      {/* Data */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-foreground/90">
          Data em que tudo começou
        </Label>
        <div className="space-y-1">
          <Input
            id="date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => handleDateChange(e.target.value)}
            onBlur={() => setDateTouched(true)}
            onInvalid={(e) => { e.preventDefault(); setDateTouched(true) }}
            className={cn(
              "bg-secondary text-foreground placeholder:text-muted-foreground",
              "focus:ring-primary focus:border-primary",
              showDateError
                ? "border-destructive focus:ring-destructive focus:border-destructive"
                : "border-border",
            )}
            required
          />
          {showDateError && (
            <p role="alert" className="text-xs text-destructive px-0.5">
              A data não pode ser no futuro.
            </p>
          )}
        </div>
      </div>

      {/* Cidade */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-foreground/90">
          Cidade
        </Label>
        <CityCombobox
          id="city"
          value={city}
          onChange={(v) => {
            setCity(v)
            onFormChange?.({ date, names: name1 && name2 ? `${name1} & ${name2}` : "", email, city: v })
          }}
          required
        />
      </div>

      {/* E-mail */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground/90">
          Seu e-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="para receber seu mapa"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
          required
        />
      </div>

      {/* Nomes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name1" className="text-foreground/90">
            Nome dele
          </Label>
          <Input
            id="name1"
            type="text"
            placeholder="Pedro"
            value={name1}
            onChange={(e) => handleNameChange(e.target.value, name2)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name2" className="text-foreground/90">
            Nome dela
          </Label>
          <Input
            id="name2"
            type="text"
            placeholder="Ana"
            value={name2}
            onChange={(e) => handleNameChange(name1, e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Gerar meu céu
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Pagamento único. Receba em minutos no seu e-mail.
      </p>
    </form>
  )
}
