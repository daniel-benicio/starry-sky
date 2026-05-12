import { Star, Heart, Download } from "lucide-react"

const features = [
  {
    icon: Star,
    title: "Posições reais das estrelas",
    description: "Usamos dados astronômicos precisos para recriar o céu exato daquela noite especial."
  },
  {
    icon: Heart,
    title: "Personalizado com seus nomes",
    description: "Cada mapa é único, com os nomes do casal e a data que marcou o início de tudo."
  },
  {
    icon: Download,
    title: "Pôster para impressão",
    description: "Receba em alta resolução, pronto para emoldurar e decorar sua casa."
  }
]

export function FeatureCards() {
  return (
    <section className="py-24 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-16 text-balance">
          Um presente que conta a história de vocês
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-card/50 border border-border backdrop-blur-sm transition-all duration-300 hover:bg-card hover:border-primary/30"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
