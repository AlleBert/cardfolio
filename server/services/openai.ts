import OpenAI from "openai";
import type { Instrument } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function analyzePortfolio(instruments: Instrument[]): Promise<any> {
  try {
    const totalValue = instruments.reduce((sum, inst) => {
      const price = parseFloat(inst.currentPrice || "0");
      const invested = parseFloat(inst.investedAmount);
      return sum + (price > 0 ? invested : 0);
    }, 0);
    
    const portfolioSummary = instruments.map(inst => {
      const invested = parseFloat(inst.investedAmount);
      const percentage = totalValue > 0 ? (invested / totalValue * 100) : 0;
      return {
        name: inst.name,
        ticker: inst.ticker,
        type: inst.type,
        invested: invested,
        currentPrice: parseFloat(inst.currentPrice || "0"),
        percentage: percentage.toFixed(2)
      };
    });

    const prompt = `Analyze this financial portfolio and provide optimization recommendations in JSON format:

Portfolio Details:
${JSON.stringify(portfolioSummary, null, 2)}

Current market date: ${new Date().toISOString().split('T')[0]}

Please provide a comprehensive analysis including:
1. Three market scenarios (short, medium, long-term)
2. Optimized asset allocation recommendations
3. New instrument suggestions with rationale

Respond with JSON in this exact format:
{
  "scenarios": [
    {"term": "breve", "description": "detailed analysis"},
    {"term": "medio", "description": "detailed analysis"}, 
    {"term": "lungo", "description": "detailed analysis"}
  ],
  "optimizedAllocation": [
    {"asset_id": "existing_asset_id", "new_percentage": 25.5, "rationale": "explanation"}
  ],
  "suggestedInstruments": [
    {"name": "Full Name", "ticker": "TICKER", "isin": "ISIN_CODE", "reason": "why recommend this"}
  ]
}

Consider current market conditions, geopolitical factors, interest rates, and diversification principles for moderate risk profile.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert financial advisor with deep knowledge of global markets, asset allocation, and risk management. Analyze portfolios and provide actionable investment recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      date: new Date().toISOString(),
      scenarios: result.scenarios || [],
      optimizedAllocation: result.optimizedAllocation || [],
      suggestedInstruments: result.suggestedInstruments || []
    };
    
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Errore nell'analisi AI del portafoglio: " + (error as Error).message);
  }
}
