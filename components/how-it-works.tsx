import { PenLine, CreditCard, Mail } from "lucide-react"

const steps = [
  {
    number: 1,
    title: "Preencha os dados",
    description: "Data, cidade e nomes do casal",
    icon: PenLine,
  },
  {
    number: 2,
    title: "Pagamento único de R$4,99",
    description: "Sem assinaturas ou taxas ocultas",
    icon: CreditCard,
  },
  {
    number: 3,
    title: "Receba seu mapa por e-mail em minutos",
    description: "Pronto para imprimir e emoldurar",
    icon: Mail,
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-16 text-balance">
          Como funciona
        </h2>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-border" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Step number circle */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center mb-6">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>

                {/* Number badge */}
                <div className="absolute top-0 right-1/2 translate-x-14 -translate-y-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium z-20">
                  {step.number}
                </div>

                <h3 className="font-serif text-xl mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
