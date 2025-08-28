import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Instrument, InsertInstrument } from "@shared/schema";
import { PortfolioStats, AIAnalysis, InstrumentSearchResult, InstrumentCardData } from "@/types/portfolio";

export function usePortfolio() {
  return useQuery<Instrument[]>({
    queryKey: ["/api/instruments"],
  });
}

export function usePortfolioStats() {
  return useQuery<PortfolioStats>({
    queryKey: ["/api/portfolio/stats"],
  });
}

export function useInstrumentSearch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (query: string): Promise<InstrumentSearchResult[]> => {
      const response = await apiRequest("POST", "/api/instruments/search", { query });
      return response.json();
    },
  });
}

export function useAddInstrument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (instrument: InsertInstrument): Promise<Instrument> => {
      const response = await apiRequest("POST", "/api/instruments", instrument);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instruments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/stats"] });
    },
  });
}

export function useDeleteInstrument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiRequest("DELETE", `/api/instruments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instruments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/stats"] });
    },
  });
}

export function useUpdatePrices() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<{ message: string; count: number }> => {
      const response = await apiRequest("POST", "/api/instruments/update-prices");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instruments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/stats"] });
    },
  });
}

export function useAIAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<AIAnalysis> => {
      const response = await apiRequest("POST", "/api/portfolio/analyze");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/analysis/latest"] });
    },
  });
}

export function useLatestAIAnalysis() {
  return useQuery<AIAnalysis>({
    queryKey: ["/api/portfolio/analysis/latest"],
    retry: false,
  });
}

// Helper hook to transform instruments into card data
export function useInstrumentCards() {
  const { data: instruments, ...query } = usePortfolio();
  
  const cardData: InstrumentCardData[] = (instruments || []).map(inst => {
    const invested = parseFloat(inst.investedAmount);
    const currentPrice = parseFloat(inst.currentPrice || "0");
    const shares = invested / currentPrice || 0;
    const currentValue = shares * currentPrice;
    const profitLoss = currentValue - invested;
    const profitLossPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;

    return {
      id: inst.id,
      name: inst.name,
      ticker: inst.ticker,
      isin: inst.isin || undefined,
      type: inst.type,
      investedAmount: invested,
      currentPrice,
      currentValue,
      profitLoss,
      profitLossPercent,
      lastUpdate: inst.priceLastUpdated ? new Date(inst.priceLastUpdated) : undefined,
    };
  });

  return {
    ...query,
    data: cardData,
  };
}
