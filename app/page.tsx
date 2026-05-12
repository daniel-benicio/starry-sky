"use client"

import { StarBackground } from "@/components/star-background"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { FeatureCards } from "@/components/feature-cards"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"
import { OrderFormData } from "@/components/order-form"

export default function Home() {
  const handleSubmit = (data: OrderFormData) => {
    // TODO: Replace with actual Stripe checkout redirect
    // Example: redirect to Stripe with form data as metadata
    console.log("Form submitted, redirecting to Stripe...", data)
    
    // Placeholder for Stripe redirect
    // window.location.href = `/api/checkout?date=${data.date}&city=${data.city}&email=${data.email}&name1=${data.name1}&name2=${data.name2}`
    alert(`Redirecionando para pagamento...\n\nDados: ${data.name1} & ${data.name2}\nData: ${data.date}\nCidade: ${data.city}\nE-mail: ${data.email}`)
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
