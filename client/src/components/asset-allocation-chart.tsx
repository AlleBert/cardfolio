import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";
import { InstrumentCardData } from "@/types/portfolio";

interface AssetAllocationChartProps {
  instruments: InstrumentCardData[];
}

const CHART_COLORS = [
  'hsl(214, 100%, 50%)', // Primary blue
  'hsl(142, 71%, 45%)',  // Green
  'hsl(258, 90%, 60%)',  // Purple
  'hsl(45, 93%, 55%)',   // Yellow
  'hsl(10, 79%, 58%)',   // Red-orange
  'hsl(280, 87%, 55%)',  // Magenta
  'hsl(196, 85%, 55%)',  // Cyan
  'hsl(32, 95%, 58%)',   // Orange
  'hsl(160, 84%, 39%)',  // Teal
  'hsl(291, 64%, 42%)',  // Dark purple
];

export default function AssetAllocationChart({ instruments }: AssetAllocationChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || instruments.length === 0) {
      // Destroy existing chart if instruments become empty
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    // Destroy existing chart before creating new one
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Calculate total portfolio value
    const totalValue = instruments.reduce((sum, inst) => sum + inst.currentValue, 0);
    
    // Prepare data for chart - only include instruments with positive values
    const chartData = instruments
      .filter(inst => inst.currentValue > 0)
      .map((inst, index) => ({
        label: inst.ticker,
        name: inst.name,
        value: inst.currentValue,
        percentage: totalValue > 0 ? (inst.currentValue / totalValue) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending

    if (chartData.length === 0) {
      return;
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: chartData.map(item => item.label),
        datasets: [{
          data: chartData.map(item => item.percentage),
          backgroundColor: chartData.map(item => item.color),
          borderWidth: 0,
          hoverBorderWidth: 2,
          hoverBorderColor: 'hsl(0, 0%, 100%)',
          borderRadius: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // We'll create custom legend below
          },
          tooltip: {
            backgroundColor: 'hsl(0, 0%, 100%)',
            titleColor: 'hsl(222.2, 84%, 4.9%)',
            bodyColor: 'hsl(215.4, 16.3%, 46.9%)',
            borderColor: 'hsl(214.3, 31.8%, 91.4%)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                return chartData[index].name;
              },
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
        hover: {
          mode: 'nearest',
          intersect: true
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [instruments]);

  if (instruments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-center" data-testid="empty-chart">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            Nessun dato da visualizzare
          </p>
        </div>
      </div>
    );
  }

  const totalValue = instruments.reduce((sum, inst) => sum + inst.currentValue, 0);
  const topInstruments = instruments
    .filter(inst => inst.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 8); // Show top 8 instruments in legend

  return (
    <div className="space-y-4" data-testid="asset-allocation-chart">
      {/* Chart Canvas */}
      <div className="relative h-48 w-full flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          className="max-w-full max-h-full"
          data-testid="allocation-chart-canvas"
        />
      </div>
      
      {/* Custom Legend */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {topInstruments.map((instrument, index) => {
          const percentage = totalValue > 0 ? (instrument.currentValue / totalValue) * 100 : 0;
          return (
            <div 
              key={instrument.id} 
              className="flex items-center justify-between text-sm"
              data-testid={`chart-legend-${instrument.ticker}`}
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-foreground font-medium truncate">
                  {instrument.ticker}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {instrument.name}
                </span>
              </div>
              <span className="font-medium text-muted-foreground ml-2 flex-shrink-0">
                {percentage.toFixed(1)}%
              </span>
            </div>
          );
        })}
        
        {/* Show "Others" if there are more than 8 instruments */}
        {instruments.filter(inst => inst.currentValue > 0).length > 8 && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-muted-foreground">Altri strumenti</span>
            </div>
            <span className="font-medium text-muted-foreground">
              {instruments
                .filter(inst => inst.currentValue > 0)
                .slice(8)
                .reduce((sum, inst) => {
                  const percentage = totalValue > 0 ? (inst.currentValue / totalValue) * 100 : 0;
                  return sum + percentage;
                }, 0)
                .toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
