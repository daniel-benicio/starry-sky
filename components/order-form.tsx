"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [date, setDate] = useState("")
  const [city, setCity] = useState("")
  const [email, setEmail] = useState("")
  const [name1, setName1] = useState("")
  const [name2, setName2] = useState("")

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
    const formData: OrderFormData = {
      date,
      city,
      email,
      name1,
      name2,
      names: `${name1} & ${name2}`
    }
    onSubmit?.(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="date" className="text-foreground/90">
          Data em que tudo começou
        </Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city" className="text-foreground/90">
          Cidade
        </Label>
        <Input
          id="city"
          type="text"
          placeholder="São Paulo, Brasil"
          value={city}
          onChange={(e) => {
            setCity(e.target.value)
            onFormChange?.({ date, names: name1 && name2 ? `${name1} & ${name2}` : "", email, city: e.target.value })
          }}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
          required
        />
      </div>

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
