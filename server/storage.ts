import { type Instrument, type InsertInstrument, type AiAnalysis, type InsertAiAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Instrument operations
  getInstruments(): Promise<Instrument[]>;
  getInstrument(id: string): Promise<Instrument | undefined>;
  getInstrumentByTicker(ticker: string): Promise<Instrument | undefined>;
  createInstrument(instrument: InsertInstrument): Promise<Instrument>;
  updateInstrument(id: string, updates: Partial<Instrument>): Promise<Instrument>;
  deleteInstrument(id: string): Promise<boolean>;
  
  // AI Analysis operations
  getLatestAiAnalysis(): Promise<AiAnalysis | undefined>;
  createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis>;
  getAiAnalyses(limit?: number): Promise<AiAnalysis[]>;
}

export class MemStorage implements IStorage {
  private instruments: Map<string, Instrument>;
  private aiAnalyses: Map<string, AiAnalysis>;

  constructor() {
    this.instruments = new Map();
    this.aiAnalyses = new Map();
  }

  async getInstruments(): Promise<Instrument[]> {
    return Array.from(this.instruments.values()).sort((a, b) => 
      parseFloat(b.investedAmount) - parseFloat(a.investedAmount)
    );
  }

  async getInstrument(id: string): Promise<Instrument | undefined> {
    return this.instruments.get(id);
  }

  async getInstrumentByTicker(ticker: string): Promise<Instrument | undefined> {
    return Array.from(this.instruments.values()).find(
      (instrument) => instrument.ticker.toLowerCase() === ticker.toLowerCase()
    );
  }

  async createInstrument(insertInstrument: InsertInstrument): Promise<Instrument> {
    const id = randomUUID();
    const instrument: Instrument = {
      ...insertInstrument,
      id,
      isin: insertInstrument.isin || null,
      currentPrice: insertInstrument.currentPrice || null,
      priceLastUpdated: insertInstrument.priceLastUpdated || null,
      currency: insertInstrument.currency || "EUR",
      createdAt: new Date(),
    };
    this.instruments.set(id, instrument);
    return instrument;
  }

  async updateInstrument(id: string, updates: Partial<Instrument>): Promise<Instrument> {
    const existing = this.instruments.get(id);
    if (!existing) {
      throw new Error("Instrument not found");
    }
    const updated = { ...existing, ...updates };
    this.instruments.set(id, updated);
    return updated;
  }

  async deleteInstrument(id: string): Promise<boolean> {
    return this.instruments.delete(id);
  }

  async getLatestAiAnalysis(): Promise<AiAnalysis | undefined> {
    const analyses = Array.from(this.aiAnalyses.values());
    return analyses.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];
  }

  async createAiAnalysis(insertAnalysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const id = randomUUID();
    const analysis: AiAnalysis = {
      ...insertAnalysis,
      id,
      date: new Date(),
      scenarios: insertAnalysis.scenarios || null,
      optimizedAllocation: insertAnalysis.optimizedAllocation || null,
      suggestedInstruments: insertAnalysis.suggestedInstruments || null,
      portfolioSnapshot: insertAnalysis.portfolioSnapshot || null,
    };
    this.aiAnalyses.set(id, analysis);
    return analysis;
  }

  async getAiAnalyses(limit = 10): Promise<AiAnalysis[]> {
    const analyses = Array.from(this.aiAnalyses.values());
    return analyses
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
