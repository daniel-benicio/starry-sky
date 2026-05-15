"use client"

import { useRouter } from "next/navigation"
import { StarBackground } from "@/components/star-background"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { FeatureCards } from "@/components/feature-cards"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"
import { OrderFormData } from "@/components/order-form"

export default function Home() {
  const router = useRouter()

  const handleSubmit = (data: OrderFormData) => {
    const params = new URLSearchParams({
      date: data.date,
      city: data.city,
      email: data.email,
      name1: data.name1,
      name2: data.name2,
    })
    router.push(`/result?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <StarBackground />
      <HeroSection onSubmit={handleSubmit} />
      <HowItWorks />
      <FeatureCards />
      <Testimonials />
      <Footer />
    </main>
  )
}
