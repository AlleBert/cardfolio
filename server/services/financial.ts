import { Instrument } from "@shared/schema";

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdate: Date;
}

export interface InstrumentInfo {
  name: string;
  ticker: string;
  isin?: string;
  type: string;
  currency: string;
  price: number;
}

class FinancialService {
  private readonly YAHOO_FINANCE_API = "https://query1.finance.yahoo.com/v8/finance/chart/";
  private readonly ALPHA_VANTAGE_API = "https://www.alphavantage.co/query";
  private readonly ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || process.env.FINANCIAL_API_KEY || "demo";

  async searchInstrument(query: string): Promise<InstrumentInfo[]> {
    try {
      // Try Yahoo Finance first for ticker lookup
      const yahooResults = await this.searchYahoo(query);
      if (yahooResults.length > 0) {
        return yahooResults;
      }

      // Fallback to Alpha Vantage
      return await this.searchAlphaVantage(query);
    } catch (error) {
      console.error("Error searching instruments:", error);
      throw new Error("Failed to search instruments. Please try again.");
    }
  }

  private async searchYahoo(query: string): Promise<InstrumentInfo[]> {
    try {
      // Yahoo Finance search endpoint
      const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=6&newsCount=0`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error("Yahoo Finance search failed");
      }

      const data = await response.json();
      const quotes = data.quotes || [];

      return quotes
        .filter((quote: any) => quote.symbol && quote.shortname)
        .slice(0, 5)
        .map((quote: any) => ({
          name: quote.shortname || quote.longname || quote.symbol,
          ticker: quote.symbol,
          isin: quote.isin || undefined,
          type: this.mapYahooType(quote.quoteType || quote.typeDisp),
          currency: quote.currency || "USD",
          price: quote.regularMarketPrice || 0,
        }));
    } catch (error) {
      console.error("Yahoo search error:", error);
      return [];
    }
  }

  private async searchAlphaVantage(query: string): Promise<InstrumentInfo[]> {
    try {
      const url = `${this.ALPHA_VANTAGE_API}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${this.ALPHA_VANTAGE_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Alpha Vantage search failed");
      }

      const data = await response.json();
      const matches = data.bestMatches || [];

      return matches.slice(0, 5).map((match: any) => ({
        name: match["2. name"],
        ticker: match["1. symbol"],
        type: "azione", // Alpha Vantage primarily stocks
        currency: match["8. currency"] || "USD",
        price: 0, // Will be fetched separately
      }));
    } catch (error) {
      console.error("Alpha Vantage search error:", error);
      return [];
    }
  }

  async getCurrentPrice(ticker: string): Promise<MarketData> {
    try {
      // Try Yahoo Finance first
      const yahooData = await this.getYahooPrice(ticker);
      if (yahooData) {
        return yahooData;
      }

      // Fallback to Alpha Vantage
      return await this.getAlphaVantagePrice(ticker);
    } catch (error) {
      console.error(`Error getting price for ${ticker}:`, error);
      throw new Error(`Failed to get current price for ${ticker}`);
    }
  }

  private async getYahooPrice(ticker: string): Promise<MarketData | null> {
    const symbol = ticker.toUpperCase();
    const commonHeaders = {
      // Some Yahoo endpoints are picky without a UA
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
    } as Record<string, string>;

    try {
      // 1) Try chart API
      const chartUrl = `${this.YAHOO_FINANCE_API}${encodeURIComponent(symbol)}`;
      const chartRes = await fetch(chartUrl, { headers: commonHeaders });
      if (chartRes.ok) {
        const data = await chartRes.json();
        const result = data.chart?.result?.[0];
        if (result && result.meta) {
          const meta = result.meta;
          const currentPrice = meta.regularMarketPrice ?? meta.previousClose;
          const previousClose = meta.previousClose ?? currentPrice;
          if (currentPrice != null && previousClose != null) {
            const change = currentPrice - previousClose;
            const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
            return {
              symbol,
              price: currentPrice,
              change,
              changePercent,
              currency: meta.currency || "USD",
              lastUpdate: new Date(),
            };
          }
        }
      }

      // 2) Fallback: quote API (often more reliable for last price)
      const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
      const quoteRes = await fetch(quoteUrl, { headers: commonHeaders });
      if (quoteRes.ok) {
        const q = await quoteRes.json();
        const quote = q.quoteResponse?.result?.[0];
        if (quote) {
          const currentPrice = quote.regularMarketPrice ?? quote.postMarketPrice ?? quote.preMarketPrice;
          const previousClose = quote.regularMarketPreviousClose ?? quote.previousClose ?? currentPrice;
          if (currentPrice != null) {
            const change = previousClose != null ? (currentPrice - previousClose) : 0;
            const changePercent = previousClose ? (change / previousClose) * 100 : 0;
            return {
              symbol,
              price: currentPrice,
              change,
              changePercent,
              currency: quote.currency || "USD",
              lastUpdate: new Date(),
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Yahoo price error for ${symbol}:`, error);
      return null;
    }
  }

  private async getAlphaVantagePrice(ticker: string): Promise<MarketData> {
    const symbol = ticker.toUpperCase();
    const url = `${this.ALPHA_VANTAGE_API}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${this.ALPHA_VANTAGE_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Alpha Vantage price fetch failed");
    }

    const data = await response.json();
    const quote = data["Global Quote"]; 
    const rawPrice = quote?.["05. price"];
    if (!quote || rawPrice == null || rawPrice === "") {
      throw new Error("No price data available");
    }

    const price = parseFloat(rawPrice);
    const rawChange = quote["09. change"] ?? "0";
    const rawChangePct = (quote["10. change percent"] ?? "0").toString().replace("%", "");
    const change = isNaN(parseFloat(rawChange)) ? 0 : parseFloat(rawChange);
    const changePercent = isNaN(parseFloat(rawChangePct)) ? 0 : parseFloat(rawChangePct);

    return {
      symbol: ticker,
      price,
      change,
      changePercent,
      currency: "USD", // Alpha Vantage default
      lastUpdate: new Date(),
    };
  }

  async updatePrices(instruments: Instrument[]): Promise<Instrument[]> {
    const updates = await Promise.allSettled(
      instruments.map(async (instrument) => {
        try {
          const marketData = await this.getCurrentPrice(instrument.ticker);
          return {
            ...instrument,
            currentPrice: marketData.price.toString(),
            priceLastUpdated: marketData.lastUpdate,
          };
        } catch (error) {
          console.error(`Failed to update price for ${instrument.ticker}:`, error);
          return instrument; // Return unchanged if price update fails
        }
      })
    );

    return updates.map((result, index) => 
      result.status === "fulfilled" ? result.value : instruments[index]
    );
  }

  private mapYahooType(quoteType: string): string {
    const typeMap: { [key: string]: string } = {
      "EQUITY": "azione",
      "ETF": "ETF",
      "MUTUALFUND": "ETF",
      "CRYPTOCURRENCY": "crypto",
      "BOND": "obbligazione",
      "INDEX": "ETF",
    };

    return typeMap[quoteType?.toUpperCase()] || "azione";
  }
}

export const financialService = new FinancialService();
