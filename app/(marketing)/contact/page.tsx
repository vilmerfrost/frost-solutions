'use client'

import { useState } from 'react'
import { Button } from '@/components/marketing/ui/button'
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
  }

  return (
    <div className="pt-24 pb-16">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge-frost mb-4 inline-flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" />
            Kontakt
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Prata med <span className="text-gradient">oss</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Har du frågor om Frost Bygg? Vi svarar inom 24 timmar, oftast snabbare.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Kontaktinformation</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">E-post</h3>
                    <a href="mailto:hej@frostbygg.se" className="text-muted-foreground hover:text-accent transition-colors">
                      hej@frostbygg.se
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Telefon</h3>
                    <a href="tel:+46701234567" className="text-muted-foreground hover:text-accent transition-colors">
                      070-123 45 67
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Adress</h3>
                    <p className="text-muted-foreground">
                      Ljusdal, Sverige
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Svarstid</h3>
                    <p className="text-muted-foreground">
                      Inom 24 timmar (oftast snabbare)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ preview */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-frost-blue/5 p-8">
              <h3 className="font-semibold text-foreground mb-2">Vanliga frågor?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Kolla vår FAQ-sektion för snabba svar på vanliga frågor.
              </p>
              <Button variant="outline" asChild>
                <a href="/#faq">Se FAQ</a>
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Skicka meddelande</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Namn
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Ditt namn"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  E-post
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="din@email.se"
                  required
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                  Företag (valfritt)
                </label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Ditt företag"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Meddelande
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                  placeholder="Hur kan vi hjälpa dig?"
                  required
                />
              </div>

              <Button type="submit" variant="frost" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Skicka meddelande
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
