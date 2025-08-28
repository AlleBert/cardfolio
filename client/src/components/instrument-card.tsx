import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal, 
  Trash2,
  BarChart3,
  Bitcoin,
  Building2,
  Coins
} from "lucide-react";
import { InstrumentCardData } from "@/types/portfolio";
import { useDeleteInstrument } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";

interface InstrumentCardProps {
  instrument: InstrumentCardData;
}

export default function InstrumentCard({ instrument }: InstrumentCardProps) {
  const deleteInstrument = useDeleteInstrument();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteInstrument.mutate(instrument.id, {
      onSuccess: () => {
        toast({
          title: "Strumento rimosso",
          description: `${instrument.name} è stato rimosso dal portafoglio`,
        });
      },
      onError: () => {
        toast({
          title: "Errore",
          description: "Impossibile rimuovere lo strumento",
          variant: "destructive",
        });
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'crypto':
      case 'criptovaluta':
        return <Bitcoin className="h-5 w-5 text-yellow-500" />;
      case 'etf':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case 'obbligazione':
        return <Building2 className="h-5 w-5 text-green-500" />;
      default:
        return <Coins className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'crypto':
      case 'criptovaluta':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'etf':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'obbligazione':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const isProfit = instrument.profitLoss >= 0;
  const priceChangeIsPositive = (instrument.priceChangePercent || 0) >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`instrument-card-${instrument.ticker}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              {getTypeIcon(instrument.type)}
            </div>
            <div>
              <h4 className="font-semibold text-foreground" data-testid={`instrument-name-${instrument.ticker}`}>
                {instrument.name}
              </h4>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground" data-testid={`instrument-ticker-${instrument.ticker}`}>
                  {instrument.ticker}
                </p>
                <Badge variant="secondary" className={getTypeColor(instrument.type)}>
                  {instrument.type}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid={`instrument-menu-${instrument.ticker}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive"
                data-testid={`delete-instrument-${instrument.ticker}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Rimuovi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Prezzo Attuale</span>
            <div className="text-right">
              <div className="font-semibold text-foreground" data-testid={`current-price-${instrument.ticker}`}>
                €{instrument.currentPrice.toLocaleString('it-IT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </div>
              {instrument.priceChangePercent !== undefined && (
                <div className={`text-xs flex items-center ${
                  priceChangeIsPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceChangeIsPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  <span data-testid={`price-change-${instrument.ticker}`}>
                    {priceChangeIsPositive ? '+' : ''}{instrument.priceChangePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Investito</span>
            <span className="font-semibold text-foreground" data-testid={`invested-amount-${instrument.ticker}`}>
              €{instrument.investedAmount.toLocaleString('it-IT', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valore Attuale</span>
            <span className="font-semibold text-foreground" data-testid={`current-value-${instrument.ticker}`}>
              €{instrument.currentValue.toLocaleString('it-IT', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">P&L</span>
            <div className="text-right">
              <span className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`} data-testid={`profit-loss-${instrument.ticker}`}>
                {isProfit ? '+' : ''}€{instrument.profitLoss.toLocaleString('it-IT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </span>
              <div className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                ({isProfit ? '+' : ''}{instrument.profitLossPercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ultimo aggiorn.</span>
            <span data-testid={`last-update-${instrument.ticker}`}>
              {instrument.lastUpdate 
                ? instrument.lastUpdate.toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
