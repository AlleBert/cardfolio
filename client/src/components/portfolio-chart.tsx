import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";
import { InstrumentCardData } from "@/types/portfolio";

interface PortfolioChartProps {
  instruments: InstrumentCardData[];
}

const CHART_COLORS = [
  'hsl(214, 100%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(258, 90%, 60%)',
  'hsl(45, 93%, 55%)',
  'hsl(10, 79%, 58%)',
  'hsl(280, 87%, 55%)',
  'hsl(196, 85%, 55%)',
  'hsl(32, 95%, 58%)',
];

export default function PortfolioChart({ instruments }: PortfolioChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || instruments.length === 0) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const totalValue = instruments.reduce((sum, inst) => sum + inst.currentValue, 0);
    
    const chartData = instruments
      .filter(inst => inst.currentValue > 0)
      .map((inst, index) => ({
        label: inst.ticker,
        value: inst.currentValue,
        percentage: (inst.currentValue / totalValue) * 100,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: chartData.map(item => item.label),
        datasets: [{
          data: chartData.map(item => item.percentage),
          backgroundColor: chartData.map(item => item.color),
          borderWidth: 0,
          hoverBorderWidth: 2,
          hoverBorderColor: '#ffffff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const percentage = context.parsed;
                const value = chartData[context.dataIndex].value;
                return `${context.label}: €${value.toLocaleString('it-IT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })} (${percentage.toFixed(1)}%)`;
              }
            }
          }
        },
        // cutout: '60%', // Chart.js type issue
      }
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [instruments]);

  if (instruments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p>Nessun dato da visualizzare</p>
      </div>
    );
  }

  const totalValue = instruments.reduce((sum, inst) => sum + inst.currentValue, 0);
  const topInstruments = instruments
    .filter(inst => inst.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5);

  return (
    <div className="space-y-4" data-testid="portfolio-chart">
      <div className="relative h-48">
        <canvas ref={canvasRef} />
      </div>
      
      <div className="space-y-2">
        {topInstruments.map((instrument, index) => {
          const percentage = totalValue > 0 ? (instrument.currentValue / totalValue) * 100 : 0;
          return (
            <div key={instrument.id} className="flex items-center justify-between text-sm" data-testid={`chart-legend-${instrument.ticker}`}>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-foreground">{instrument.ticker}</span>
              </div>
              <span className="font-medium text-muted-foreground">
                {percentage.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
