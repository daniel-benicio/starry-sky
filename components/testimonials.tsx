import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "Dei de presente no nosso aniversário de namoro. Ela chorou de emoção. Valeu cada centavo.",
    author: "Lucas M.",
    location: "São Paulo"
  },
  {
    quote: "O mapa ficou lindo emoldurado na nossa sala. Todo mundo pergunta de onde é!",
    author: "Fernanda R.",
    location: "Rio de Janeiro"
  },
  {
    quote: "Surpreendi meu marido no Dia dos Namorados. Ele amou saber que aquele era o nosso céu.",
    author: "Carla S.",
    location: "Belo Horizonte"
  }
]

export function Testimonials() {
  return (
    <section className="py-24 px-6 relative z-10 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-16 text-balance">
          O que nossos clientes dizem
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-card/30 border border-border backdrop-blur-sm"
            >
              <Quote className="w-8 h-8 text-primary/40 mb-4" />
              <blockquote className="text-foreground/90 leading-relaxed mb-6 italic">
                {`"${testimonial.quote}"`}
              </blockquote>
              <footer>
                <p className="font-medium text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.location}</p>
              </footer>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
