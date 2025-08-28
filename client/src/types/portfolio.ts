export interface InstrumentCardData {
  id: string;
  name: string;
  ticker: string;
  isin?: string;
  type: string;
  investedAmount: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  priceChange?: number;
  priceChangePercent?: number;
  lastUpdate?: Date;
}

export interface PortfolioStats {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  byType: Record<string, number>;
  lastUpdate: string;
}

export interface AllocationData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AIScenario {
  term: string;
  description: string;
}

export interface OptimizedAllocation {
  asset_id: string;
  new_percentage: number;
  rationale: string;
}

export interface SuggestedInstrument {
  name: string;
  ticker: string;
  isin: string;
  reason: string;
}

export interface AIAnalysis {
  date: string;
  scenarios: AIScenario[];
  optimizedAllocation: OptimizedAllocation[];
  suggestedInstruments: SuggestedInstrument[];
}

export interface InstrumentSearchResult {
  name: string;
  ticker: string;
  isin?: string;
  type: string;
  currency: string;
  price: number;
}
