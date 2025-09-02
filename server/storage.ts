import { type Instrument, type InsertInstrument, type AiAnalysis, type InsertAiAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

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
  private dataFilePath: string;

  constructor() {
    this.instruments = new Map();
    this.aiAnalyses = new Map();
    // Persist data to .local/data.json relative to the repo root
    this.dataFilePath = path.resolve(import.meta.dirname, "..", ".local", "data.json");
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.dataFilePath)) {
        return;
      }
      const raw = fs.readFileSync(this.dataFilePath, "utf-8");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const instruments: Instrument[] = Array.isArray(parsed?.instruments) ? parsed.instruments : [];
      const analyses: AiAnalysis[] = Array.isArray(parsed?.aiAnalyses) ? parsed.aiAnalyses : [];

      // Revive dates
      for (const inst of instruments) {
        if (inst.createdAt) inst.createdAt = new Date(inst.createdAt);
        if (inst.priceLastUpdated) inst.priceLastUpdated = new Date(inst.priceLastUpdated);
      }
      for (const a of analyses) {
        if (a.date) a.date = new Date(a.date);
      }

      this.instruments = new Map(instruments.map((i) => [i.id, i]));
      this.aiAnalyses = new Map(analyses.map((a) => [a.id, a]));
    } catch (_e) {
      // If anything goes wrong, start fresh but do not crash
      this.instruments = new Map();
      this.aiAnalyses = new Map();
    }
  }

  private async persistToDisk(): Promise<void> {
    try {
      const dir = path.dirname(this.dataFilePath);
      await fs.promises.mkdir(dir, { recursive: true });
      const payload = {
        instruments: Array.from(this.instruments.values()),
        aiAnalyses: Array.from(this.aiAnalyses.values()),
      };
      await fs.promises.writeFile(this.dataFilePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch (_e) {
      // Ignore persistence errors in dev
    }
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
    await this.persistToDisk();
    return instrument;
  }

  async updateInstrument(id: string, updates: Partial<Instrument>): Promise<Instrument> {
    const existing = this.instruments.get(id);
    if (!existing) {
      throw new Error("Instrument not found");
    }
    const updated = { ...existing, ...updates };
    this.instruments.set(id, updated);
    await this.persistToDisk();
    return updated;
  }

  async deleteInstrument(id: string): Promise<boolean> {
    const ok = this.instruments.delete(id);
    await this.persistToDisk();
    return ok;
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
    await this.persistToDisk();
    return analysis;
  }

  async getAiAnalyses(limit = 10): Promise<AiAnalysis[]> {
    const analyses = Array.from(this.aiAnalyses.values());
    return analyses
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, limit);
  }
}

// Select storage backend: Postgres if DATABASE_URL is set, else file-backed memory
let storageImpl: IStorage;

try {
  if (process.env.DATABASE_URL) {
    // Try to use Postgres if available
    const { PostgresStorage } = require("./storage_postgres");
    storageImpl = new PostgresStorage(process.env.DATABASE_URL);
    console.log("Using PostgreSQL storage");
  } else {
    storageImpl = new MemStorage();
    console.log("Using file-backed memory storage");
  }
} catch (error) {
  console.log("PostgreSQL not available, falling back to file-backed memory storage:", error instanceof Error ? error.message : String(error));
  storageImpl = new MemStorage();
}

export const storage = storageImpl;
