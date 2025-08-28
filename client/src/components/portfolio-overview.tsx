import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import PortfolioChart from "./portfolio-chart";
import { usePortfolioStats, useInstrumentCards } from "@/hooks/use-portfolio";

export default function PortfolioOverview() {
  const { data: stats, isLoading: statsLoading } = usePortfolioStats();
  const { data: instruments } = useInstrumentCards();

  if (statsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </Card>
        </div>
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
            <div className="w-48 h-48 bg-muted rounded-full mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!stats || !instruments) {
    return null;
  }

  const isProfit = stats.totalProfitLoss >= 0;
  const allocationData = Object.entries(stats.byType).map(([type, value]) => ({
    type,
    value,
    percentage: stats.totalCurrentValue > 0 ? (value / stats.totalCurrentValue) * 100 : 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <Card className="p-6 shadow-sm" data-testid="portfolio-overview">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Il Mio Portafoglio</h2>
              <p className="text-muted-foreground">
                Ultimo aggiornamento: {new Date(stats.lastUpdate).toLocaleDateString('it-IT')} alle{' '}
                {new Date(stats.lastUpdate).toLocaleTimeString('it-IT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
              <div className="text-3xl font-bold text-foreground" data-testid="total-portfolio-value">
                €{stats.totalCurrentValue.toLocaleString('it-IT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </div>
              <div className="flex items-center justify-end space-x-2 mt-1">
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`} data-testid="total-profit-loss">
                  {isProfit ? '+' : ''}€{stats.totalProfitLoss.toLocaleString('it-IT', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })} ({isProfit ? '+' : ''}{stats.totalProfitLossPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {allocationData.map(({ type, percentage }) => (
              <div key={type} className="text-center p-4 bg-secondary rounded-lg" data-testid={`allocation-${type}`}>
                <div className="text-sm text-muted-foreground mb-1 capitalize">
                  {type === 'azione' ? 'Azioni' : 
                   type === 'crypto' ? 'Crypto' : 
                   type === 'obbligazione' ? 'Obbligazioni' : 
                   type}
                </div>
                <div className="font-semibold text-foreground">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      <Card className="p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Asset Allocation</h3>
        <PortfolioChart instruments={instruments || []} />
      </Card>
    </div>
  );
}
