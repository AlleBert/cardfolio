import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Shield, Zap, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Brain className="text-primary-foreground h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">PortfolioAI</h1>
            </div>
            <Link to="/portfolio">
              <Button data-testid="button-get-started">
                Inizia Ora
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6" data-testid="hero-title">
              Gestione Intelligente del
              <span className="text-primary block">Portafoglio Finanziario</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="hero-subtitle">
              Ottimizza i tuoi investimenti con l'AI. Monitora in tempo reale, ricevi suggerimenti intelligenti 
              e massimizza i rendimenti con il nostro assistente finanziario avanzato.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/portfolio">
                <Button size="lg" className="w-full sm:w-auto" data-testid="button-start-investing">
                  <Brain className="h-5 w-5 mr-2" />
                  Inizia a Investire
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-learn-more">
                Scopri di Più
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="features-title">
              Perché Scegliere PortfolioAI?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Strumenti avanzati per investitori moderni che vogliono ottimizzare i propri risultati
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow" data-testid="feature-ai-analysis">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Analisi AI Avanzata</h3>
              <p className="text-muted-foreground">
                Il nostro algoritmo di intelligenza artificiale analizza i mercati globali e fornisce 
                raccomandazioni personalizzate per ottimizzare il tuo portafoglio.
              </p>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow" data-testid="feature-real-time">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Prezzi in Tempo Reale</h3>
              <p className="text-muted-foreground">
                Monitora i tuoi investimenti con aggiornamenti di prezzo in tempo reale da fonti 
                finanziarie affidabili e prendi decisioni informate.
              </p>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow" data-testid="feature-diversification">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Diversificazione Intelligente</h3>
              <p className="text-muted-foreground">
                Ottieni suggerimenti di diversificazione basati su analisi di rischio avanzate 
                per proteggere e far crescere i tuoi investimenti.
              </p>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow" data-testid="feature-validation">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Validazione Automatica</h3>
              <p className="text-muted-foreground">
                Aggiungi strumenti finanziari con validazione automatica tramite ticker, ISIN 
                o nome, garantendo dati accurati e aggiornati.
              </p>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow" data-testid="feature-scenarios">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Scenari di Mercato</h3>
              <p className="text-muted-foreground">
                Ricevi analisi dettagliate su scenari di mercato a breve, medio e lungo termine 
                per pianificare le tue strategie di investimento.
              </p>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow" data-testid="feature-interface">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Interface Intuitiva</h3>
              <p className="text-muted-foreground">
                Design moderno e responsivo ottimizzato per desktop e mobile, con visualizzazioni 
                chiare dei tuoi dati finanziari e performance.
              </p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <Card className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" data-testid="cta-section">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Pronto a Ottimizzare i Tuoi Investimenti?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Unisciti a migliaia di investitori che hanno già migliorato le loro performance 
              con PortfolioAI. Inizia gratuitamente oggi stesso.
            </p>
            <Link to="/portfolio">
              <Button size="lg" data-testid="button-start-free">
                <Brain className="h-5 w-5 mr-2" />
                Inizia Gratuitamente
              </Button>
            </Link>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Brain className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="text-lg font-semibold text-foreground">PortfolioAI</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} PortfolioAI. Gestione intelligente dei tuoi investimenti.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
