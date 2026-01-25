import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Star, MapPin, Users } from 'lucide-react';

const testimonials = [
  {
    quote: 'Vi sparade 15 timmar första månaden bara på ROT-automation. Frost Bygg är exakt vad svenska byggföretag behöver.',
    name: 'Erik Andersson',
    title: 'VD',
    company: 'Anderssons Bygg AB',
    location: 'Stockholm',
    size: '5 anställda',
    avatar: 'EA',
  },
  {
    quote: 'Vi bytte från Bygglet och sparade över 25,000 kr första året. AI-funktionerna är fantastiska.',
    name: 'Maria Lindström',
    title: 'Ekonomichef',
    company: 'Nordisk Entreprenad',
    location: 'Göteborg',
    size: '12 anställda',
    avatar: 'ML',
  },
  {
    quote: 'Äntligen ett system som fungerar offline på byggplatsen. Mina snickare älskar det.',
    name: 'Jonas Bergman',
    title: 'Projektledare',
    company: 'Moderna Hus Group',
    location: 'Malmö',
    size: '8 anställda',
    avatar: 'JB',
  },
];

export function Testimonials() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-16 md:py-24">
      <div className="section-container">
        <div ref={ref} className="text-center mb-12">
          <h2 className={`text-2xl md:text-3xl font-bold text-foreground ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Vad våra kunder säger
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`group p-6 rounded-xl bg-card border border-border hover:border-accent/40 hover:shadow-lg transition-all duration-300 ${
        isVisible ? `animate-fade-in-up stagger-${index + 1}` : 'opacity-0'
      }`}
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-accent text-accent transition-transform group-hover:scale-110" style={{ transitionDelay: `${i * 50}ms` }} />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-foreground mb-6 leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold transition-transform group-hover:scale-105">
          {testimonial.avatar}
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">{testimonial.title}, {testimonial.company}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {testimonial.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {testimonial.size}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
