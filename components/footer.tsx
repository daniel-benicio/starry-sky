import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-12 px-6 relative z-10 border-t border-border">
      <div className="max-w-5xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <p className="font-serif text-xl text-foreground">
            Presente perfeito para o Dia dos Namorados
          </p>
          <Heart className="w-5 h-5 text-primary fill-primary" />
        </div>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Céu do Nosso Dia. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
