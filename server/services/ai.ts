import OpenAI from "openai";
import { Instrument } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;
let selectedModel = "gpt-5";

try {
  if (process.env.OPENROUTER_API_KEY) {
    // Prefer OpenRouter if available to avoid OpenAI quota issues
    openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
    // A strong, broadly-capable model on OpenRouter
    selectedModel = "meta-llama/llama-3.1-70b-instruct";
  } else if (process.env.OPENAI_API_KEY || process.env.AI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
    });
    selectedModel = "gpt-5";
  }
} catch (error) {
  console.log("OpenAI client initialization failed, will use fallback analysis");
}

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
    // If OpenAI client is not available, use fallback analysis
    if (!openai) {
      console.log("OpenAI client not available, using fallback analysis");
      return this.generateFallbackAnalysis(instruments);
    }

    try {
      const portfolioData = this.preparePortfolioData(instruments);
      const marketContext = await this.getMarketContext();
      
      const prompt = this.buildAnalysisPrompt(portfolioData, marketContext);
      
      const response = await openai.chat.completions.create({
        model: selectedModel, // prefers OpenRouter model when configured; falls back to OpenAI gpt-5
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
    } catch (error: any) {
      console.error("AI analysis error:", error);
      
      // Check if it's a quota/rate limit error
      if (error.status === 429 || error.code === 'insufficient_quota') {
        console.log("OpenAI quota exceeded, using fallback analysis");
        return this.generateFallbackAnalysis(instruments);
      }
      
      // For any other error, fall back to basic analysis
      console.log("OpenAI API error, using fallback analysis");
      return this.generateFallbackAnalysis(instruments);
    }
  }

  private generateFallbackAnalysis(instruments: Instrument[]): PortfolioAnalysis {
    const portfolioData = this.preparePortfolioData(instruments);
    
    // Basic analysis based on portfolio composition
    const hasStocks = instruments.some(inst => inst.type === 'stock');
    const hasETFs = instruments.some(inst => inst.type === 'etf');
    const hasBonds = instruments.some(inst => inst.type === 'bond');
    const hasCrypto = instruments.some(inst => inst.type === 'crypto');
    
    const diversificationCount = [hasStocks, hasETFs, hasBonds, hasCrypto].filter(Boolean).length;
    
    const scenarios = [
      {
        term: "breve",
        description: "Nel breve termine, il portafoglio mostra una composizione " + 
          (diversificationCount >= 3 ? "ben diversificata" : "da diversificare maggiormente") + 
          ". Si consiglia di mantenere liquidità per eventuali opportunità di mercato."
      },
      {
        term: "medio", 
        description: "A medio termine, focus sulla diversificazione geografica e settoriale. " +
          "Considerare l'aggiunta di ETF globali e settori in crescita come tecnologia pulita."
      },
      {
        term: "lungo",
        description: "Nel lungo termine, bilanciare crescita e stabilità. Aumentare gradualmente " +
          "l'esposizione ai mercati emergenti e considerare investimenti ESG per sostenibilità."
      }
    ];

    const optimizedAllocation = portfolioData.slice(0, 3).map((asset, index) => ({
      asset_id: asset.id,
      new_percentage: index === 0 ? 40 : index === 1 ? 35 : 25,
      rationale: index === 0 ? "Asset principale con solida performance" : 
                index === 1 ? "Diversificazione settoriale" : "Bilanciamento del rischio"
    }));

    const suggestedInstruments = [
      {
        name: "Vanguard FTSE All-World UCITS ETF",
        ticker: "VWCE",
        isin: "IE00BK5BQT80",
        reason: "Diversificazione globale a basso costo"
      },
      {
        name: "iShares Core MSCI Emerging Markets IMI",
        ticker: "EMIM",
        isin: "IE00BKM4GZ66", 
        reason: "Esposizione ai mercati emergenti"
      },
      {
        name: "Vanguard ESG Global All Cap UCITS ETF",
        ticker: "V3AA",
        isin: "IE00BNG8L278",
        reason: "Investimento sostenibile e ESG"
      }
    ];

    return {
      date: new Date().toISOString(),
      scenarios,
      optimizedAllocation,
      suggestedInstruments
    };
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
