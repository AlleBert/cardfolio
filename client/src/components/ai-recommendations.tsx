import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, X, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useAIAnalysis, useAddInstrument } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { AIAnalysis } from "@/types/portfolio";

interface AIRecommendationsProps {
  onClose: () => void;
}

export default function AIRecommendations({ onClose }: AIRecommendationsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const aiAnalysis = useAIAnalysis();
  const addInstrument = useAddInstrument();
  const { toast } = useToast();

  const handleAnalyze = () => {
    aiAnalysis.mutate(undefined, {
      onSuccess: (data) => {
        setAnalysis(data);
        toast({
          title: "Analisi completata",
          description: "L'AI ha analizzato il tuo portafoglio",
        });
      },
      onError: (error: any) => {
        const errorMessage = error?.message || "Errore durante l'analisi AI";
        toast({
          title: "Errore",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  const handleAddSuggestedInstrument = async (suggestion: any) => {
    // In a real implementation, we would need to search for the instrument
    // to get current price and validate the data
    toast({
      title: "Funzionalità in sviluppo",
      description: "L'aggiunta automatica degli strumenti suggeriti sarà disponibile presto",
    });
  };

  const getTermBadgeColor = (term: string) => {
    switch (term.toLowerCase()) {
      case 'breve':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'medio':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'lungo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card className="mb-8" data-testid="ai-recommendations">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Analisi AI del Portafoglio</CardTitle>
              <p className="text-sm text-muted-foreground">
                Raccomandazioni basate sull'analisi del mercato attuale
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-ai">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!analysis && !aiAnalysis.isPending && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">
              Analizza il tuo portafoglio
            </h4>
            <p className="text-muted-foreground mb-6">
              Ottieni raccomandazioni intelligenti per ottimizzare i tuoi investimenti
            </p>
            <Button onClick={handleAnalyze} data-testid="button-start-analysis">
              <Brain className="h-4 w-4 mr-2" />
              Avvia Analisi AI
            </Button>
          </div>
        )}

        {aiAnalysis.isPending && (
          <div className="text-center py-8" data-testid="analysis-loading">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Analizzando il tuo portafoglio...</p>
            <p className="text-sm text-muted-foreground mt-2">
              L'AI sta valutando i tuoi investimenti e le condizioni di mercato
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6" data-testid="analysis-results">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Scenarios */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">Scenari di Mercato</h4>
                <div className="space-y-3">
                  {analysis.scenarios.map((scenario, index) => (
                    <div key={index} className="bg-secondary rounded-lg p-4" data-testid={`scenario-${scenario.term}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getTermBadgeColor(scenario.term)}>
                          {scenario.term} Termine
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{scenario.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimized Allocation */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">Allocazione Ottimizzata</h4>
                <div className="space-y-3">
                  {analysis.optimizedAllocation.map((item, index) => {
                    const isIncrease = item.new_percentage > 0;
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg" data-testid={`allocation-${index}`}>
                        <div className="flex-1">
                          <span className="font-medium text-foreground">Asset {item.asset_id}</span>
                          <p className="text-xs text-muted-foreground">{item.rationale}</p>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <span className="font-semibold text-foreground">
                            {item.new_percentage.toFixed(1)}%
                          </span>
                          {isIncrease ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Suggested Instruments */}
            {analysis.suggestedInstruments.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-4">Nuovi Strumenti Suggeriti</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.suggestedInstruments.map((suggestion, index) => (
                    <div key={index} className="bg-secondary rounded-lg p-4" data-testid={`suggestion-${suggestion.ticker}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground">{suggestion.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.ticker} • {suggestion.isin}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddSuggestedInstrument(suggestion)}
                          data-testid={`add-suggestion-${suggestion.ticker}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Aggiungi
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button onClick={handleAnalyze} variant="outline" data-testid="button-reanalyze">
                <Brain className="h-4 w-4 mr-2" />
                Rigenera Analisi
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
