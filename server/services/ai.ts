import OpenAI from "openai";
import { Instrument } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
});

export interface PortfolioAnalysis {
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

class AIService {
  async analyzePortfolio(instruments: Instrument[]): Promise<PortfolioAnalysis> {
    try {
      const portfolioData = this.preparePortfolioData(instruments);
      const marketContext = await this.getMarketContext();
      
      const prompt = this.buildAnalysisPrompt(portfolioData, marketContext);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert financial advisor with deep knowledge of global markets, portfolio optimization, and risk management. Analyze portfolios and provide actionable recommendations in Italian. Always respond with valid JSON in the specified format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        date: new Date().toISOString(),
        scenarios: analysisResult.scenarios || [],
        optimizedAllocation: analysisResult.optimizedAllocation || [],
        suggestedInstruments: analysisResult.suggestedInstruments || [],
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      throw new Error("Failed to analyze portfolio. Please try again.");
    }
  }

  private preparePortfolioData(instruments: Instrument[]) {
    const totalValue = instruments.reduce((sum, inst) => {
      const invested = parseFloat(inst.investedAmount);
      const currentPrice = parseFloat(inst.currentPrice || "0");
      const shares = invested / currentPrice || 0;
      return sum + (shares * currentPrice);
    }, 0);

    return instruments.map(inst => {
      const invested = parseFloat(inst.investedAmount);
      const currentPrice = parseFloat(inst.currentPrice || "0");
      const shares = invested / currentPrice || 0;
      const currentValue = shares * currentPrice;
      const percentage = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

      return {
        id: inst.id,
        name: inst.name,
        ticker: inst.ticker,
        type: inst.type,
        investedAmount: invested,
        currentValue,
        percentage: percentage.toFixed(2),
        profitLoss: currentValue - invested,
        profitLossPercent: invested > 0 ? ((currentValue - invested) / invested) * 100 : 0,
      };
    });
  }

  private async getMarketContext(): Promise<string> {
    // In a real implementation, this would fetch current market data
    // For now, we'll provide a general market context
    return `
    Contesto di mercato attuale (${new Date().toLocaleDateString('it-IT')}):
    - Mercati azionari: volatilità moderata con focus su sostenibilità e tecnologia
    - Tassi di interesse: tendenza al rialzo nelle economie sviluppate
    - Inflazione: in graduale diminuzione ma ancora sopra i target
    - Geopolitica: tensioni localizzate con impatto sui settori energia e commodity
    - Mercati emergenti: opportunità selettive in Asia e America Latina
    - Settori in crescita: tecnologia pulita, sanità digitale, infrastrutture
    - Valute: USD forte, EUR stabile, volatilità nelle crypto
    `;
  }

  private buildAnalysisPrompt(portfolioData: any[], marketContext: string): string {
    return `
    Analizza questo portafoglio finanziario e fornisci raccomandazioni di ottimizzazione.

    PORTAFOGLIO ATTUALE:
    ${JSON.stringify(portfolioData, null, 2)}

    ${marketContext}

    Fornisci un'analisi completa in formato JSON con questa struttura esatta:

    {
      "scenarios": [
        {
          "term": "breve|medio|lungo",
          "description": "Descrizione dettagliata dello scenario"
        }
      ],
      "optimizedAllocation": [
        {
          "asset_id": "id_strumento_esistente",
          "new_percentage": numero_percentuale,
          "rationale": "Spiegazione della modifica"
        }
      ],
      "suggestedInstruments": [
        {
          "name": "Nome completo strumento",
          "ticker": "TICKER",
          "isin": "CODICE_ISIN",
          "reason": "Motivazione dell'inclusione"
        }
      ]
    }

    REQUISITI:
    1. Analizza 3 scenari: breve termine (3-6 mesi), medio termine (6-18 mesi), lungo termine (2-5 anni)
    2. Proponi un'allocazione ottimizzata considerando diversificazione, rischio e rendimento
    3. Suggerisci massimo 3 nuovi strumenti con ticker e ISIN reali
    4. Ordina tutto per rilevanza/impatto
    5. Usa un approccio di rischio moderato
    6. Considera la situazione geopolitica ed economica attuale
    7. Scrivi tutto in italiano
    `;
  }
}

export const aiService = new AIService();
