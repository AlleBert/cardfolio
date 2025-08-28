import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const instruments = pgTable("instruments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ticker: text("ticker").notNull(),
  isin: text("isin"),
  type: text("type").notNull(), // azione, ETF, obbligazione, crypto
  investedAmount: decimal("invested_amount", { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 8 }),
  currency: text("currency").notNull().default("EUR"),
  priceLastUpdated: timestamp("price_last_updated"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiAnalyses = pgTable("ai_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").defaultNow(),
  scenarios: jsonb("scenarios"),
  optimizedAllocation: jsonb("optimized_allocation"),
  suggestedInstruments: jsonb("suggested_instruments"),
  portfolioSnapshot: jsonb("portfolio_snapshot"),
});

export const insertInstrumentSchema = createInsertSchema(instruments).omit({
  id: true,
  createdAt: true,
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalyses).omit({
  id: true,
  date: true,
});

export type InsertInstrument = z.infer<typeof insertInstrumentSchema>;
export type Instrument = typeof instruments.$inferSelect;
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;
export type AiAnalysis = typeof aiAnalyses.$inferSelect;

// Additional types for API responses
export const instrumentSearchSchema = z.object({
  query: z.string().min(1),
});

export const priceUpdateSchema = z.object({
  instruments: z.array(z.string()),
});

export type InstrumentSearch = z.infer<typeof instrumentSearchSchema>;
export type PriceUpdate = z.infer<typeof priceUpdateSchema>;

// Additional types for API responses
export interface ValidationResponse {
  valid: boolean;
  name?: string;
  ticker?: string;
  currentPrice?: number;
  error?: string;
}

export interface AIRecommendation {
  date: string;
  scenarios: Array<{
    term: string;
    description: string;
  }>;
  optimizedAllocation: Array<{
    asset_id: string;
    new_percentage: number;
    rationale: string;
  }>;
  suggestedInstruments: Array<{
    name: string;
    ticker: string;
    isin: string;
    reason: string;
  }>;
}
