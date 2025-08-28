import type { ValidationResponse } from "@shared/schema";

const YAHOO_FINANCE_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_KEY || "demo";

export async function validateInstrument(query: string): Promise<ValidationResponse> {
  try {
    // Try Yahoo Finance first
    const yahooResult = await validateWithYahoo(query);
    if (yahooResult.valid) {
      return yahooResult;
    }
    
    // Fallback to Alpha Vantage
    return await validateWithAlphaVantage(query);
    
  } catch (error) {
    console.error("Validation error:", error);
    return {
      valid: false,
      error: "Errore nella validazione dello strumento finanziario"
    };
  }
}

async function validateWithYahoo(ticker: string): Promise<ValidationResponse> {
  try {
    const response = await fetch(`${YAHOO_FINANCE_BASE}/${ticker.toUpperCase()}`);
    
    if (!response.ok) {
      return { valid: false, error: "Strumento non trovato" };
    }
    
    const data = await response.json();
    const chart = data.chart?.result?.[0];
    
    if (!chart) {
      return { valid: false, error: "Dati non disponibili" };
    }
    
    const meta = chart.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    
    return {
      valid: true,
      name: meta.longName || meta.shortName || ticker,
      ticker: meta.symbol,
      currentPrice: currentPrice
    };
    
  } catch (error) {
    return { valid: false, error: "Errore di connessione" };
  }
}

async function validateWithAlphaVantage(query: string): Promise<ValidationResponse> {
  try {
    const response = await fetch(
      `${ALPHA_VANTAGE_BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    if (!response.ok) {
      return { valid: false, error: "Errore del servizio di ricerca" };
    }
    
    const data = await response.json();
    const matches = data.bestMatches;
    
    if (!matches || matches.length === 0) {
      return { valid: false, error: "Strumento non trovato" };
    }
    
    const match = matches[0];
    
    // Get current price
    const priceResponse = await fetch(
      `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${match["1. symbol"]}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    let currentPrice = 0;
    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      currentPrice = parseFloat(priceData["Global Quote"]?.["05. price"] || "0");
    }
    
    return {
      valid: true,
      name: match["2. name"],
      ticker: match["1. symbol"],
      currentPrice: currentPrice
    };
    
  } catch (error) {
    return { valid: false, error: "Errore nella validazione" };
  }
}

export async function getPriceUpdate(ticker: string): Promise<any | null> {
  try {
    const response = await fetch(`${YAHOO_FINANCE_BASE}/${ticker.toUpperCase()}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const chart = data.chart?.result?.[0];
    
    if (!chart) {
      return null;
    }
    
    const meta = chart.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      symbol: meta.symbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("Price update error:", error);
    return null;
  }
}

export async function updateAllPrices(tickers: string[]): Promise<void> {
  const promises = tickers.map(ticker => getPriceUpdate(ticker));
  const results = await Promise.allSettled(promises);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      console.log(`Updated price for ${tickers[index]}: ${result.value.price}`);
    } else {
      console.error(`Failed to update price for ${tickers[index]}`);
    }
  });
}
