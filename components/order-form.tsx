"use client"

import { useState, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CityCombobox } from "@/components/city-combobox"
import { Sparkles, CalendarIcon } from "lucide-react"
import { formatDateInput, dateDisplayToISO } from "@/lib/formatters"

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
  const [date,        setDate]        = useState("")   // yyyy-mm-dd
  const [dateDisplay, setDateDisplay] = useState("")   // dd/mm/yyyy
  const datePickerRef = useRef<HTMLInputElement>(null)
  const [city,  setCity]  = useState("")
  const [email, setEmail] = useState("")
  const [name1, setName1] = useState("")
  const [name2, setName2] = useState("")

  // ── Validação da data ──────────────────────────────────────────────────────
  // today é calculado uma única vez por montagem — não muda durante a sessão.
  const today = useMemo(() => new Date().toISOString().split("T")[0], [])

  const [dateTouched, setDateTouched] = useState(false)
  const dateIsFuture  = !!date && date > today
  const dateInvalid   = dateTouched && (!date || dateIsFuture)
  const showDateError = dateInvalid

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDateChange = (raw: string) => {
    const display = formatDateInput(raw)
    const iso     = dateDisplayToISO(display)
    setDateDisplay(display)
    setDate(iso)
    onFormChange?.({ date: iso, names: name1 && name2 ? `${name1} & ${name2}` : "", email, city })
  }

  const handleDatePickerChange = (iso: string) => {
    if (!iso) return
    const [yyyy, mm, dd] = iso.split("-")
    const display = `${dd}/${mm}/${yyyy}`
    setDateDisplay(display)
    setDate(iso)
    onFormChange?.({ date: iso, names: name1 && name2 ? `${name1} & ${name2}` : "", email, city })
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
    if (!date || dateIsFuture) {
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
          <div className="relative">
            <Input
              id="date"
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              value={dateDisplay}
              onChange={(e) => handleDateChange(e.target.value)}
              onBlur={() => setDateTouched(true)}
              className={cn(
                "bg-secondary text-foreground placeholder:text-muted-foreground pr-9",
                "focus:ring-primary focus:border-primary",
                showDateError
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-border",
              )}
              required={!date}
            />
            <button
              type="button"
              onClick={() => datePickerRef.current?.showPicker()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Abrir calendário"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            <input
              ref={datePickerRef}
              type="date"
              value={date}
              max={today}
              onChange={(e) => handleDatePickerChange(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
          {showDateError && (
            <p role="alert" className="text-xs text-destructive px-0.5">
              {dateIsFuture ? "A data não pode ser no futuro." : "Informe uma data válida."}
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
