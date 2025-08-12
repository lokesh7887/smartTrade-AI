import { AdvancedPredictionEngine, type PredictionResult } from "./predictionEngine"

export interface EnsemblePrediction extends PredictionResult {
  modelAgreement: number
  alternativeScenarios: {
    scenario: string
    probability: number
    prediction: "BUY" | "SELL" | "HOLD"
    reasoning: string
  }[]
}

export class EnsemblePredictor {
  // Multiple prediction models for ensemble
  static generateEnsemblePrediction(symbol: string, timeframe = "1D"): EnsemblePrediction {
    // Generate predictions from multiple "models"
    const predictions: PredictionResult[] = []

    // Model 1: Technical Analysis Heavy
    predictions.push(AdvancedPredictionEngine.generateAdvancedPrediction(symbol, timeframe))

    // Model 2: Momentum Based (simulate different approach)
    const momentumPrediction = this.generateMomentumPrediction(symbol, timeframe)
    predictions.push(momentumPrediction)

    // Model 3: Mean Reversion Based
    const meanReversionPrediction = this.generateMeanReversionPrediction(symbol, timeframe)
    predictions.push(meanReversionPrediction)

    // Calculate ensemble results
    const buyVotes = predictions.filter((p) => p.prediction === "BUY").length
    const sellVotes = predictions.filter((p) => p.prediction === "SELL").length
    const holdVotes = predictions.filter((p) => p.prediction === "HOLD").length

    const totalVotes = predictions.length
    const modelAgreement = Math.max(buyVotes, sellVotes, holdVotes) / totalVotes

    // Final ensemble prediction
    let finalPrediction: "BUY" | "SELL" | "HOLD" = "HOLD"
    if (buyVotes > sellVotes && buyVotes > holdVotes) finalPrediction = "BUY"
    else if (sellVotes > buyVotes && sellVotes > holdVotes) finalPrediction = "SELL"

    // Average confidence weighted by agreement
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    const adjustedConfidence = avgConfidence * modelAgreement

    // Combine reasoning from all models
    const allReasons = predictions.flatMap((p) => p.reasoning)
    const uniqueReasons = [...new Set(allReasons)].slice(0, 8)

    // Alternative scenarios
    const alternativeScenarios = [
      {
        scenario: "Bull Market Continuation",
        probability: buyVotes / totalVotes,
        prediction: "BUY" as const,
        reasoning: "Strong momentum and technical breakout patterns suggest continued upward movement",
      },
      {
        scenario: "Market Correction",
        probability: sellVotes / totalVotes,
        prediction: "SELL" as const,
        reasoning: "Overbought conditions and resistance levels indicate potential pullback",
      },
      {
        scenario: "Sideways Consolidation",
        probability: holdVotes / totalVotes,
        prediction: "HOLD" as const,
        reasoning: "Mixed signals suggest price consolidation in current range",
      },
    ].sort((a, b) => b.probability - a.probability)

    const basePrediction = predictions[0]

    return {
      ...basePrediction,
      prediction: finalPrediction,
      confidence: Number(adjustedConfidence.toFixed(1)),
      reasoning: uniqueReasons,
      modelAgreement: Number((modelAgreement * 100).toFixed(1)),
      alternativeScenarios,
    }
  }

  private static generateMomentumPrediction(symbol: string, timeframe: string): PredictionResult {
    const base = AdvancedPredictionEngine.generateAdvancedPrediction(symbol, timeframe)

    // Simulate momentum-focused analysis
    const momentumBias = Math.random() > 0.6 ? "BUY" : Math.random() > 0.3 ? "HOLD" : "SELL"

    return {
      ...base,
      prediction: momentumBias,
      confidence: Math.min(95, base.confidence + (Math.random() - 0.5) * 20),
      reasoning: [
        "Momentum analysis shows strong directional bias",
        "Price velocity indicates continuation pattern",
        ...base.reasoning.slice(2),
      ],
    }
  }

  private static generateMeanReversionPrediction(symbol: string, timeframe: string): PredictionResult {
    const base = AdvancedPredictionEngine.generateAdvancedPrediction(symbol, timeframe)

    // Simulate mean reversion analysis (opposite bias)
    const reversionBias = base.prediction === "BUY" ? "SELL" : base.prediction === "SELL" ? "BUY" : "HOLD"

    return {
      ...base,
      prediction: reversionBias,
      confidence: Math.min(90, base.confidence * 0.8),
      reasoning: [
        "Mean reversion signals suggest price correction",
        "Statistical analysis indicates overextension",
        ...base.reasoning.slice(2),
      ],
    }
  }
}
