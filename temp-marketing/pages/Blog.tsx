import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, User, ArrowRight, Search, BookOpen } from 'lucide-react';

const blogPosts = [
  {
    slug: 'rot-automation-sparar-tid',
    title: 'Varför ROT-automation sparar byggföretag 15 timmar per månad',
    excerpt: 'Manuell ROT-hantering är en tidstjuv. Lär dig hur AI kan automatisera processen och spara ditt företag värdefull tid.',
    category: 'Product',
    readTime: '5 min',
    date: '15 jan 2025',
    image: '🤖',
  },
  {
    slug: 'bygglet-vs-frost-bygg',
    title: 'Bygglet vs Frost Bygg: Komplett jämförelse 2025',
    excerpt: 'En detaljerad jämförelse av funktioner, priser och användarupplevelse mellan Bygglet och Frost Bygg.',
    category: 'Industry',
    readTime: '7 min',
    date: '12 jan 2025',
    image: '⚖️',
  },
  {
    slug: 'hur-vi-byggde-frost-bygg',
    title: 'Hur vi byggde Frost Bygg på 2 veckor',
    excerpt: 'Berättelsen om hur en 18-åring från Ljusdal byggde ett komplett projektverktyg på rekordtid.',
    category: 'Company',
    readTime: '4 min',
    date: '10 jan 2025',
    image: '🚀',
  },
  {
    slug: 'verkliga-kostnaden-byggprogramvara',
    title: 'Den verkliga kostnaden av byggprogramvara',
    excerpt: 'Dolda avgifter, setup-kostnader och per-användare-priser. Vi bryter ner vad byggprogramvara verkligen kostar.',
    category: 'Industry',
    readTime: '6 min',
    date: '8 jan 2025',
    image: '💰',
  },
  {
    slug: 'ai-i-byggbranschen-2025',
    title: 'AI i byggbranschen: Vad som är möjligt 2025',
    excerpt: 'Från ROT-automation till prediktiv analys. En översikt av hur AI förändrar byggbranschen.',
    category: 'Industry',
    readTime: '8 min',
    date: '5 jan 2025',
    image: '⚡',
  },
];

const categories = ['Alla', 'Product', 'Industry', 'Company'];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="section-container">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="badge-frost mb-4 inline-flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Blogg
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Insikter för <span className="text-gradient">byggbranschen</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Tips, guider och nyheter om byggprojekthantering, AI och hur du kan effektivisera ditt företag.
            </p>
          </div>

          {/* Search & Categories */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-12">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Sök artiklar..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cat === 'Alla'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Blog Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group rounded-2xl border border-border bg-card overflow-hidden card-hover"
              >
                <div className="aspect-video bg-gradient-to-br from-accent/10 to-frost-blue/10 flex items-center justify-center text-6xl">
                  {post.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      Vilmer Frost
                    </div>
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-16 rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-frost-blue/5 p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Få de senaste insikterna
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Prenumerera på vårt nyhetsbrev för tips om byggprojekthantering och AI.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="din@email.se"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <Button variant="frost">
                Prenumerera
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;