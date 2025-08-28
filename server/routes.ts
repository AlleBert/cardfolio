import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { financialService } from "./services/financial";
import { aiService } from "./services/ai";
import { 
  insertInstrumentSchema, 
  instrumentSearchSchema,
  insertAiAnalysisSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all instruments
  app.get("/api/instruments", async (req, res) => {
    try {
      const instruments = await storage.getInstruments();
      res.json(instruments);
    } catch (error) {
      console.error("Error fetching instruments:", error);
      res.status(500).json({ 
        error: { 
          code: "FETCH_ERROR", 
          message: "Failed to fetch instruments" 
        } 
      });
    }
  });

  // Search instruments
  app.post("/api/instruments/search", async (req, res) => {
    try {
      const { query } = instrumentSearchSchema.parse(req.body);
      const results = await financialService.searchInstrument(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching instruments:", error);
      res.status(400).json({ 
        error: { 
          code: "SEARCH_ERROR", 
          message: "Failed to search instruments. Please check your query." 
        } 
      });
    }
  });

  // Add new instrument
  app.post("/api/instruments", async (req, res) => {
    try {
      const instrumentData = insertInstrumentSchema.parse(req.body);
      
      // Check if instrument already exists
      const existing = await storage.getInstrumentByTicker(instrumentData.ticker);
      if (existing) {
        return res.status(409).json({ 
          error: { 
            code: "DUPLICATE_INSTRUMENT", 
            message: "Questo strumento è già presente nel tuo portafoglio" 
          } 
        });
      }

      // Get current price
      try {
        const marketData = await financialService.getCurrentPrice(instrumentData.ticker);
        instrumentData.currentPrice = marketData.price.toString();
        instrumentData.priceLastUpdated = marketData.lastUpdate;
      } catch (priceError) {
        console.warn(`Could not get price for ${instrumentData.ticker}:`, priceError);
        // Continue without price - it can be updated later
      }

      const instrument = await storage.createInstrument(instrumentData);
      res.status(201).json(instrument);
    } catch (error) {
      console.error("Error creating instrument:", error);
      res.status(400).json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Invalid instrument data provided" 
        } 
      });
    }
  });

  // Update instrument prices
  app.post("/api/instruments/update-prices", async (req, res) => {
    try {
      const instruments = await storage.getInstruments();
      const updatedInstruments = await financialService.updatePrices(instruments);
      
      // Update each instrument in storage
      for (const updated of updatedInstruments) {
        await storage.updateInstrument(updated.id, {
          currentPrice: updated.currentPrice,
          priceLastUpdated: updated.priceLastUpdated,
        });
      }

      res.json({ message: "Prices updated successfully", count: updatedInstruments.length });
    } catch (error) {
      console.error("Error updating prices:", error);
      res.status(500).json({ 
        error: { 
          code: "UPDATE_ERROR", 
          message: "Failed to update prices" 
        } 
      });
    }
  });

  // Delete instrument
  app.delete("/api/instruments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteInstrument(id);
      
      if (!deleted) {
        return res.status(404).json({ 
          error: { 
            code: "NOT_FOUND", 
            message: "Strumento non trovato" 
          } 
        });
      }

      res.json({ message: "Instrument deleted successfully" });
    } catch (error) {
      console.error("Error deleting instrument:", error);
      res.status(500).json({ 
        error: { 
          code: "DELETE_ERROR", 
          message: "Failed to delete instrument" 
        } 
      });
    }
  });

  // Get portfolio analysis from AI
  app.post("/api/portfolio/analyze", async (req, res) => {
    try {
      const instruments = await storage.getInstruments();
      
      if (instruments.length === 0) {
        return res.status(400).json({ 
          error: { 
            code: "EMPTY_PORTFOLIO", 
            message: "Non puoi analizzare un portafoglio vuoto. Aggiungi almeno uno strumento." 
          } 
        });
      }

      const analysis = await aiService.analyzePortfolio(instruments);
      
      // Store the analysis
      await storage.createAiAnalysis({
        scenarios: analysis.scenarios,
        optimizedAllocation: analysis.optimizedAllocation,
        suggestedInstruments: analysis.suggestedInstruments,
        portfolioSnapshot: instruments,
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
      res.status(500).json({ 
        error: { 
          code: "AI_ANALYSIS_ERROR", 
          message: "Failed to analyze portfolio. Please try again later." 
        } 
      });
    }
  });

  // Get latest AI analysis
  app.get("/api/portfolio/analysis/latest", async (req, res) => {
    try {
      const analysis = await storage.getLatestAiAnalysis();
      if (!analysis) {
        return res.status(404).json({ 
          error: { 
            code: "NO_ANALYSIS", 
            message: "Nessuna analisi disponibile" 
          } 
        });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching latest analysis:", error);
      res.status(500).json({ 
        error: { 
          code: "FETCH_ERROR", 
          message: "Failed to fetch analysis" 
        } 
      });
    }
  });

  // Get portfolio statistics
  app.get("/api/portfolio/stats", async (req, res) => {
    try {
      const instruments = await storage.getInstruments();
      
      const stats = instruments.reduce((acc, inst) => {
        const invested = parseFloat(inst.investedAmount);
        const currentPrice = parseFloat(inst.currentPrice || "0");
        const shares = invested / currentPrice || 0;
        const currentValue = shares * currentPrice;
        const profitLoss = currentValue - invested;

        acc.totalInvested += invested;
        acc.totalCurrentValue += currentValue;
        acc.totalProfitLoss += profitLoss;

        // Count by type
        acc.byType[inst.type] = (acc.byType[inst.type] || 0) + currentValue;

        return acc;
      }, {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalProfitLoss: 0,
        byType: {} as Record<string, number>,
      });

      const totalProfitLossPercent = stats.totalInvested > 0 
        ? (stats.totalProfitLoss / stats.totalInvested) * 100 
        : 0;

      res.json({
        ...stats,
        totalProfitLossPercent,
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error calculating portfolio stats:", error);
      res.status(500).json({ 
        error: { 
          code: "STATS_ERROR", 
          message: "Failed to calculate portfolio statistics" 
        } 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
