import { type AiAnalysis, type InsertAiAnalysis, type InsertInstrument, type Instrument } from "@shared/schema";
import { IStorage } from "./storage";
import { randomUUID } from "crypto";
import pg from "pg";

export class PostgresStorage implements IStorage {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ 
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test connection on startup
    this.testConnection();
  }

  private async testConnection() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log("PostgreSQL connection successful");
    } catch (error) {
      console.error("PostgreSQL connection failed:", error instanceof Error ? error.message : String(error));
      throw new Error("Cannot connect to PostgreSQL database");
    }
  }

  async getInstruments(): Promise<Instrument[]> {
    try {
      const { rows } = await this.pool.query(
        `select id, name, ticker, isin, type, invested_amount as "investedAmount", current_price as "currentPrice", currency, price_last_updated as "priceLastUpdated", created_at as "createdAt" from instruments order by invested_amount desc`
      );
      return rows;
    } catch (error) {
      console.error("Error fetching instruments from PostgreSQL:", error instanceof Error ? error.message : String(error));
      throw new Error("Failed to fetch instruments from database");
    }
  }

  async getInstrument(id: string): Promise<Instrument | undefined> {
    const { rows } = await this.pool.query(
      `select id, name, ticker, isin, type, invested_amount as "investedAmount", current_price as "currentPrice", currency, price_last_updated as "priceLastUpdated", created_at as "createdAt" from instruments where id = $1 limit 1`,
      [id]
    );
    return rows[0];
  }

  async getInstrumentByTicker(ticker: string): Promise<Instrument | undefined> {
    const { rows } = await this.pool.query(
      `select id, name, ticker, isin, type, invested_amount as "investedAmount", current_price as "currentPrice", currency, price_last_updated as "priceLastUpdated", created_at as "createdAt" from instruments where lower(ticker) = lower($1) limit 1`,
      [ticker]
    );
    return rows[0];
  }

  async createInstrument(insertInstrument: InsertInstrument): Promise<Instrument> {
    const id = randomUUID();
    const { rows } = await this.pool.query(
      `insert into instruments (id, name, ticker, isin, type, invested_amount, current_price, currency, price_last_updated, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
       returning id, name, ticker, isin, type, invested_amount as "investedAmount", current_price as "currentPrice", currency, price_last_updated as "priceLastUpdated", created_at as "createdAt"`,
      [
        id,
        insertInstrument.name,
        insertInstrument.ticker,
        insertInstrument.isin ?? null,
        insertInstrument.type,
        insertInstrument.investedAmount,
        insertInstrument.currentPrice ?? null,
        insertInstrument.currency ?? "EUR",
        insertInstrument.priceLastUpdated ?? null,
      ]
    );
    return rows[0];
  }

  async updateInstrument(id: string, updates: Partial<Instrument>): Promise<Instrument> {
    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const setField = (column: string, value: any) => {
      fields.push(`${column} = $${idx++}`);
      values.push(value);
    };

    if (updates.name !== undefined) setField("name", updates.name);
    if (updates.ticker !== undefined) setField("ticker", updates.ticker);
    if (updates.isin !== undefined) setField("isin", updates.isin);
    if (updates.type !== undefined) setField("type", updates.type);
    if (updates.investedAmount !== undefined) setField("invested_amount", updates.investedAmount);
    if (updates.currentPrice !== undefined) setField("current_price", updates.currentPrice);
    if (updates.currency !== undefined) setField("currency", updates.currency);
    if (updates.priceLastUpdated !== undefined) setField("price_last_updated", updates.priceLastUpdated);

    values.push(id);

    const { rows } = await this.pool.query(
      `update instruments set ${fields.join(", ")} where id = $${idx} returning id, name, ticker, isin, type, invested_amount as "investedAmount", current_price as "currentPrice", currency, price_last_updated as "priceLastUpdated", created_at as "createdAt"`,
      values
    );
    return rows[0];
  }

  async deleteInstrument(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(`delete from instruments where id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async getLatestAiAnalysis(): Promise<AiAnalysis | undefined> {
    const { rows } = await this.pool.query(
      `select id, date, scenarios, optimized_allocation as "optimizedAllocation", suggested_instruments as "suggestedInstruments", portfolio_snapshot as "portfolioSnapshot" from ai_analyses order by date desc limit 1`
    );
    return rows[0];
  }

  async createAiAnalysis(insertAnalysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const id = randomUUID();
    const { rows } = await this.pool.query(
      `insert into ai_analyses (id, date, scenarios, optimized_allocation, suggested_instruments, portfolio_snapshot)
       values ($1, now(), $2, $3, $4, $5)
       returning id, date, scenarios, optimized_allocation as "optimizedAllocation", suggested_instruments as "suggestedInstruments", portfolio_snapshot as "portfolioSnapshot"`,
      [id, insertAnalysis.scenarios ?? null, insertAnalysis.optimizedAllocation ?? null, insertAnalysis.suggestedInstruments ?? null, insertAnalysis.portfolioSnapshot ?? null]
    );
    return rows[0];
  }

  async getAiAnalyses(limit = 10): Promise<AiAnalysis[]> {
    const { rows } = await this.pool.query(
      `select id, date, scenarios, optimized_allocation as "optimizedAllocation", suggested_instruments as "suggestedInstruments", portfolio_snapshot as "portfolioSnapshot" from ai_analyses order by date desc limit $1`,
      [limit]
    );
    return rows;
  }
}


