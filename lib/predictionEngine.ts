import { AdvancedTechnicalAnalysis, type TechnicalIndicators } from "./advancedIndicators"

export interface MarketData {
  symbol: string
  prices: number[]
  highs: number[]
  lows: number[]
  volumes: number[]
  timestamps: string[]
}

export interface PredictionResult {
  symbol: string
  timeframe: string
  prediction: "BUY" | "SELL" | "HOLD"
  confidence: number
  targetPrice: number
  stopLoss: number
  reasoning: string[]
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  technicalScore: number
  momentumScore: number
  volatilityScore: number
  volumeScore: number
  generatedAt: string
}

export class AdvancedPredictionEngine {
  // Generate realistic market data for testing
  static generateMarketData(symbol: string, days = 100): MarketData {
    const basePrice = 100 + Math.random() * 200
    const prices: number[] = []
    const highs: number[] = []
    const lows: number[] = []
    const volumes: number[] = []
    const timestamps: string[] = []

    let currentPrice = basePrice
    const trend = (Math.random() - 0.5) * 0.02 // Random trend

    for (let i = 0; i < days; i++) {
      // Add trend and random walk
      const dailyChange = trend + (Math.random() - 0.5) * 0.05
      currentPrice *= 1 + dailyChange

      // Generate OHLC data
      const volatility = 0.02 + Math.random() * 0.03
      const high = currentPrice * (1 + Math.random() * volatility)
      const low = currentPrice * (1 - Math.random() * volatility)

      prices.push(currentPrice)
      highs.push(high)
      lows.push(low)
      volumes.push(Math.floor(1000000 + Math.random() * 5000000))

      const date = new Date()
      date.setDate(date.getDate() - (days - i))
      timestamps.push(date.toISOString())
    }

    return { symbol, prices, highs, lows, volumes, timestamps }
  }

  // Advanced pattern recognition
  static detectPatterns(prices: number[]): { pattern: string; confidence: number; bullish: boolean }[] {
    const patterns: { pattern: string; confidence: number; bullish: boolean }[] = []

    if (prices.length < 20) return patterns

    const recent = prices.slice(-20)

    // Double Bottom Pattern
    if (this.isDoubleBottom(recent)) {
      patterns.push({ pattern: "Double Bottom", confidence: 0.75, bullish: true })
    }

    // Double Top Pattern
    if (this.isDoubleTop(recent)) {
      patterns.push({ pattern: "Double Top", confidence: 0.75, bullish: false })
    }

    // Head and Shoulders
    if (this.isHeadAndShoulders(recent)) {
      patterns.push({ pattern: "Head and Shoulders", confidence: 0.8, bullish: false })
    }

    // Ascending Triangle
    if (this.isAscendingTriangle(recent)) {
      patterns.push({ pattern: "Ascending Triangle", confidence: 0.7, bullish: true })
    }

    // Support/Resistance Breakout
    const breakout = this.detectBreakout(prices)
    if (breakout) {
      patterns.push({
        pattern: `${breakout.type} Breakout`,
        confidence: breakout.confidence,
        bullish: breakout.bullish,
      })
    }

    return patterns
  }

  private static isDoubleBottom(prices: number[]): boolean {
    if (prices.length < 10) return false

    const minIndex1 = prices.indexOf(Math.min(...prices.slice(0, 8)))
    const minIndex2 = prices.indexOf(Math.min(...prices.slice(8)))

    if (minIndex1 === -1 || minIndex2 === -1) return false

    const min1 = prices[minIndex1]
    const min2 = prices[minIndex2 + 8]

    // Check if the two lows are similar (within 3%)
    return Math.abs(min1 - min2) / min1 < 0.03
  }

  private static isDoubleTop(prices: number[]): boolean {
    if (prices.length < 10) return false

    const maxIndex1 = prices.indexOf(Math.max(...prices.slice(0, 8)))
    const maxIndex2 = prices.indexOf(Math.max(...prices.slice(8)))

    if (maxIndex1 === -1 || maxIndex2 === -1) return false

    const max1 = prices[maxIndex1]
    const max2 = prices[maxIndex2 + 8]

    return Math.abs(max1 - max2) / max1 < 0.03
  }

  private static isHeadAndShoulders(prices: number[]): boolean {
    if (prices.length < 15) return false

    const third = Math.floor(prices.length / 3)
    const leftShoulder = Math.max(...prices.slice(0, third))
    const head = Math.max(...prices.slice(third, third * 2))
    const rightShoulder = Math.max(...prices.slice(third * 2))

    return head > leftShoulder && head > rightShoulder && Math.abs(leftShoulder - rightShoulder) / leftShoulder < 0.05
  }

  private static isAscendingTriangle(prices: number[]): boolean {
    if (prices.length < 10) return false

    const highs = []
    const lows = []

    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
        highs.push(prices[i])
      }
      if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
        lows.push(prices[i])
      }
    }

    if (highs.length < 2 || lows.length < 2) return false

    // Check if highs are relatively flat and lows are ascending
    const highsFlat = Math.abs(highs[0] - highs[highs.length - 1]) / highs[0] < 0.02
    const lowsAscending = lows[lows.length - 1] > lows[0]

    return highsFlat && lowsAscending
  }

  private static detectBreakout(prices: number[]): { type: string; confidence: number; bullish: boolean } | null {
    if (prices.length < 20) return null

    const recent = prices.slice(-10)
    const historical = prices.slice(-30, -10)

    const recentHigh = Math.max(...recent)
    const recentLow = Math.min(...recent)
    const historicalHigh = Math.max(...historical)
    const historicalLow = Math.min(...historical)

    // Resistance breakout
    if (recentHigh > historicalHigh * 1.02) {
      return { type: "Resistance", confidence: 0.8, bullish: true }
    }

    // Support breakdown
    if (recentLow < historicalLow * 0.98) {
      return { type: "Support", confidence: 0.8, bullish: false }
    }

    return null
  }

  // Market sentiment analysis
  static analyzeMarketSentiment(data: MarketData): {
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL"
    score: number
    factors: string[]
  } {
    const factors: string[] = []
    let sentimentScore = 0

    // Volume analysis
    const recentVolume = data.volumes.slice(-5).reduce((a, b) => a + b, 0) / 5
    const historicalVolume = data.volumes.slice(-20, -5).reduce((a, b) => a + b, 0) / 15

    if (recentVolume > historicalVolume * 1.2) {
      sentimentScore += 0.2
      factors.push("Above average volume")
    }

    // Price momentum
    const recentPrices = data.prices.slice(-5)
    const momentum = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0]

    if (momentum > 0.02) {
      sentimentScore += 0.3
      factors.push("Strong upward momentum")
    } else if (momentum < -0.02) {
      sentimentScore -= 0.3
      factors.push("Strong downward momentum")
    }

    // Volatility analysis
    const volatility = this.calculateVolatility(data.prices.slice(-20))
    if (volatility > 0.03) {
      sentimentScore -= 0.1
      factors.push("High volatility indicates uncertainty")
    } else if (volatility < 0.015) {
      sentimentScore += 0.1
      factors.push("Low volatility indicates stability")
    }

    let sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL"
    if (sentimentScore > 0.2) sentiment = "BULLISH"
    else if (sentimentScore < -0.2) sentiment = "BEARISH"

    return { sentiment, score: sentimentScore, factors }
  }

  private static calculateVolatility(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]))
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    return Math.sqrt(variance)
  }

  // Enhanced prediction with ensemble methods
  static generateAdvancedPrediction(symbol: string, timeframe = "1D"): PredictionResult {
    // Generate realistic market data
    const marketData = this.generateMarketData(symbol, 100)
    const currentPrice = marketData.prices[marketData.prices.length - 1]

    // Calculate technical indicators
    const indicators: TechnicalIndicators = {
      sma: AdvancedTechnicalAnalysis.calculateSMA(marketData.prices, 20),
      ema: AdvancedTechnicalAnalysis.calculateEMA(marketData.prices, 12),
      rsi: AdvancedTechnicalAnalysis.calculateRSI(marketData.prices),
      macd: AdvancedTechnicalAnalysis.calculateMACD(marketData.prices),
      bollingerBands: AdvancedTechnicalAnalysis.calculateBollingerBands(marketData.prices),
      stochastic: AdvancedTechnicalAnalysis.calculateStochastic(marketData.highs, marketData.lows, marketData.prices),
      atr: AdvancedTechnicalAnalysis.calculateATR(marketData.highs, marketData.lows, marketData.prices),
      adx: AdvancedTechnicalAnalysis.calculateADX(marketData.highs, marketData.lows, marketData.prices),
    }

    // Get technical signals
    const technicalSignals = AdvancedTechnicalAnalysis.generateTradingSignals(indicators, currentPrice)

    // Pattern recognition
    const patterns = this.detectPatterns(marketData.prices)

    // Market sentiment
    const sentiment = this.analyzeMarketSentiment(marketData)

    // Ensemble scoring
    let bullishScore = 0
    let bearishScore = 0
    const reasoning: string[] = []

    // Technical analysis weight (40%)
    if (technicalSignals.signal === "BUY") {
      bullishScore += 0.4 * technicalSignals.strength
      reasoning.push(
        `Technical analysis: ${technicalSignals.signal} (${(technicalSignals.strength * 100).toFixed(0)}% strength)`,
      )
    } else if (technicalSignals.signal === "SELL") {
      bearishScore += 0.4 * technicalSignals.strength
      reasoning.push(
        `Technical analysis: ${technicalSignals.signal} (${(technicalSignals.strength * 100).toFixed(0)}% strength)`,
      )
    }

    // Pattern recognition weight (30%)
    patterns.forEach((pattern) => {
      if (pattern.bullish) {
        bullishScore += 0.3 * pattern.confidence
        reasoning.push(`Pattern detected: ${pattern.pattern} (${(pattern.confidence * 100).toFixed(0)}% confidence)`)
      } else {
        bearishScore += 0.3 * pattern.confidence
        reasoning.push(`Pattern detected: ${pattern.pattern} (${(pattern.confidence * 100).toFixed(0)}% confidence)`)
      }
    })

    // Market sentiment weight (30%)
    if (sentiment.sentiment === "BULLISH") {
      bullishScore += 0.3 * Math.abs(sentiment.score)
      reasoning.push(`Market sentiment: ${sentiment.sentiment}`)
    } else if (sentiment.sentiment === "BEARISH") {
      bearishScore += 0.3 * Math.abs(sentiment.score)
      reasoning.push(`Market sentiment: ${sentiment.sentiment}`)
    }

    // Add technical reasons
    reasoning.push(...technicalSignals.reasons.slice(0, 2))
    reasoning.push(...sentiment.factors.slice(0, 2))

    // Final prediction
    const totalScore = bullishScore + bearishScore
    let prediction: "BUY" | "SELL" | "HOLD" = "HOLD"
    let confidence = 50

    if (totalScore > 0) {
      if (bullishScore > bearishScore) {
        prediction = "BUY"
        confidence = Math.min(95, 50 + (bullishScore / totalScore) * 45)
      } else {
        prediction = "SELL"
        confidence = Math.min(95, 50 + (bearishScore / totalScore) * 45)
      }
    }

    // Calculate target price and stop loss
    const atr = indicators.atr
    const targetPrice =
      prediction === "BUY"
        ? currentPrice * (1 + (confidence / 100) * 0.1)
        : currentPrice * (1 - (confidence / 100) * 0.1)

    const stopLoss = prediction === "BUY" ? currentPrice - atr * 2 : currentPrice + atr * 2

    // Risk assessment
    const volatility = this.calculateVolatility(marketData.prices.slice(-20))
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM"

    if (volatility < 0.02 && indicators.adx < 25) riskLevel = "LOW"
    else if (volatility > 0.04 || indicators.adx > 40) riskLevel = "HIGH"

    return {
      symbol: symbol.toUpperCase(),
      timeframe,
      prediction,
      confidence: Number(confidence.toFixed(1)),
      targetPrice: Number(targetPrice.toFixed(2)),
      stopLoss: Number(stopLoss.toFixed(2)),
      reasoning: reasoning.slice(0, 6), // Limit to top 6 reasons
      riskLevel,
      technicalScore: Number((technicalSignals.strength * 100).toFixed(1)),
      momentumScore: Number(((bullishScore - bearishScore + 1) * 50).toFixed(1)),
      volatilityScore: Number((volatility * 100).toFixed(1)),
      volumeScore: Number((sentiment.score * 100 + 50).toFixed(1)),
      generatedAt: new Date().toISOString(),
    }
  }
}
