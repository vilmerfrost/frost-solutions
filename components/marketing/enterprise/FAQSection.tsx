'use client'

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/marketing/ui/accordion';

const faqs = [
  {
    question: 'Hur lång är uppsägningstiden?',
    answer: 'Ingen bindningstid. Avsluta när du vill, ingen uppsägning krävs.',
  },
  {
    question: 'Kan vi migrera från Bygglet till Frost Bygg?',
    answer: 'Ja! Vi hjälper dig importera projekt, kunder och tiddata. Kontakta oss för gratis migrationshjälp.',
  },
  {
    question: 'Fungerar det offline på byggplatsen?',
    answer: 'Ja, full funktionalitet utan internet. Data synkas automatiskt när du får uppkoppling.',
  },
  {
    question: 'Hur många användare ingår?',
    answer: 'Obegränsat antal användare för 499 kr/månad. Ingen extra kostnad per person.',
  },
  {
    question: 'Vilka integrationer finns?',
    answer: 'Fortnox, Visma eEkonomi och Skatteverket för ROT/RUT.',
  },
  {
    question: 'Hur säker är min data?',
    answer: 'Bank-level encryption, GDPR-compliant, data lagras i Sverige med dagliga backups.',
  },
];

export function FAQSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="faq" className="py-16 md:py-24 bg-card border-y border-border">
      <div className="section-container max-w-3xl">
        <div ref={ref} className="mb-10">
          <h2 className={`text-2xl md:text-3xl font-bold text-foreground ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Vanliga frågor
          </h2>
        </div>

        <Accordion 
          type="single" 
          collapsible 
          className={`space-y-2 ${isVisible ? 'animate-fade-in-up stagger-1' : 'opacity-0'}`}
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg px-5 bg-background"
            >
              <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
