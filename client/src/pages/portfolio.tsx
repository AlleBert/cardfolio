import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, RefreshCw, User } from "lucide-react";
import PortfolioOverview from "@/components/portfolio-overview";
import InstrumentCard from "@/components/instrument-card";
import AddInstrumentModal from "@/components/add-instrument-modal";
import AIRecommendations from "@/components/ai-recommendations";
import { useInstrumentCards, useUpdatePrices } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";

export default function Portfolio() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const { data: instruments, isLoading } = useInstrumentCards();
  const { toast } = useToast();
  
  const updatePrices = useUpdatePrices();

  // Auto-update prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (instruments && instruments.length > 0) {
        updatePrices.mutate(undefined, {
          onSuccess: (data) => {
            console.log(`Updated ${data.count} instrument prices`);
          },
          onError: (error) => {
            console.error("Price update failed:", error);
          }
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [instruments, updatePrices]);

  const handleManualPriceUpdate = () => {
    updatePrices.mutate(undefined, {
      onSuccess: (data) => {
        toast({
          title: "Prezzi aggiornati",
          description: `Aggiornati ${data.count} strumenti`,
        });
      },
      onError: () => {
        toast({
          title: "Errore",
          description: "Impossibile aggiornare i prezzi",
          variant: "destructive",
        });
      }
    });
  };

  const handleAIAnalysis = () => {
    if (!instruments || instruments.length === 0) {
      toast({
        title: "Portafoglio vuoto",
        description: "Aggiungi almeno uno strumento per ottenere raccomandazioni AI",
        variant: "destructive",
      });
      return;
    }
    
    setShowAIRecommendations(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Brain className="text-primary-foreground h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">PortfolioAI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Prezzi aggiornati</span>
                <span data-testid="last-update-time">
                  {new Date().toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualPriceUpdate}
                disabled={updatePrices.isPending}
                data-testid="button-refresh-prices"
              >
                <RefreshCw className={`h-4 w-4 ${updatePrices.isPending ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-user-menu">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Portfolio Overview */}
        <PortfolioOverview />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button
            className="flex-1"
            onClick={() => setShowAddModal(true)}
            data-testid="button-add-instrument"
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Strumento
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleAIAnalysis}
            data-testid="button-ai-reallocator"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Ri-allocator
          </Button>
        </div>

        {/* Instruments List */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-6">I Tuoi Strumenti</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : instruments && instruments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="instruments-grid">
              {instruments.map((instrument) => (
                <InstrumentCard key={instrument.id} instrument={instrument} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="empty-portfolio">
              <div className="space-y-3">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-medium text-foreground">Nessuno strumento nel portafoglio</h4>
                <p className="text-muted-foreground">
                  Inizia aggiungendo il tuo primo strumento finanziario
                </p>
                <Button onClick={() => setShowAddModal(true)} data-testid="button-add-first-instrument">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Strumento
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* AI Recommendations */}
        {showAIRecommendations && (
          <AIRecommendations onClose={() => setShowAIRecommendations(false)} />
        )}
      </main>

      {/* Add Instrument Modal */}
      <AddInstrumentModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
