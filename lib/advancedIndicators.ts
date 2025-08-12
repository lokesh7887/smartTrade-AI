export interface TechnicalIndicators {
  sma: number[]
  ema: number[]
  rsi: number
  macd: {
    macd: number
    signal: number
    histogram: number
  }
  bollingerBands: {
    upper: number
    middle: number
    lower: number
  }
  stochastic: {
    k: number
    d: number
  }
  atr: number
  adx: number
}

export class AdvancedTechnicalAnalysis {
  static calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = []
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      sma.push(sum / period)
    }
    return sma
  }

  static calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = []
    const multiplier = 2 / (period + 1)

    // Start with SMA for first value
    const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
    ema.push(sma)

    for (let i = period; i < prices.length; i++) {
      const currentEma = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
      ema.push(currentEma)
    }

    return ema
  }

  static calculateRSI(prices: number[], period = 14): number {
    const changes = prices.slice(1).map((price, i) => price - prices[i])
    const gains = changes.map((change) => (change > 0 ? change : 0))
    const losses = changes.map((change) => (change < 0 ? Math.abs(change) : 0))

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period

    if (avgLoss === 0) return 100

    const rs = avgGain / avgLoss
    return 100 - 100 / (1 + rs)
  }

  static calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(prices, fastPeriod)
    const slowEMA = this.calculateEMA(prices, slowPeriod)

    const macdLine: number[] = []
    const minLength = Math.min(fastEMA.length, slowEMA.length)

    for (let i = 0; i < minLength; i++) {
      macdLine.push(fastEMA[i] - slowEMA[i])
    }

    const signalLine = this.calculateEMA(macdLine, signalPeriod)
    const histogram = macdLine.slice(-signalLine.length).map((macd, i) => macd - signalLine[i])

    return {
      macd: macdLine[macdLine.length - 1] || 0,
      signal: signalLine[signalLine.length - 1] || 0,
      histogram: histogram[histogram.length - 1] || 0,
    }
  }

  static calculateBollingerBands(prices: number[], period = 20, stdDev = 2) {
    const sma = this.calculateSMA(prices, period)
    const currentSMA = sma[sma.length - 1]

    const recentPrices = prices.slice(-period)
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - currentSMA, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)

    return {
      upper: currentSMA + standardDeviation * stdDev,
      middle: currentSMA,
      lower: currentSMA - standardDeviation * stdDev,
    }
  }

  static calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3) {
    const recentHighs = highs.slice(-kPeriod)
    const recentLows = lows.slice(-kPeriod)
    const currentClose = closes[closes.length - 1]

    const highestHigh = Math.max(...recentHighs)
    const lowestLow = Math.min(...recentLows)

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100

    // Calculate %D as SMA of %K
    const kValues = [k] // In practice, you'd maintain a history of K values
    const d = kValues.reduce((a, b) => a + b, 0) / kValues.length

    return { k, d }
  }

  static calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number {
    const trueRanges: number[] = []

    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i]
      const tr2 = Math.abs(highs[i] - closes[i - 1])
      const tr3 = Math.abs(lows[i] - closes[i - 1])

      trueRanges.push(Math.max(tr1, tr2, tr3))
    }

    const recentTR = trueRanges.slice(-period)
    return recentTR.reduce((a, b) => a + b, 0) / period
  }

  static calculateADX(highs: number[], lows: number[], closes: number[], period = 14): number {
    // Simplified ADX calculation
    const trueRanges: number[] = []
    const plusDM: number[] = []
    const minusDM: number[] = []

    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i]
      const tr2 = Math.abs(highs[i] - closes[i - 1])
      const tr3 = Math.abs(lows[i] - closes[i - 1])
      trueRanges.push(Math.max(tr1, tr2, tr3))

      const upMove = highs[i] - highs[i - 1]
      const downMove = lows[i - 1] - lows[i]

      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    }

    // This is a simplified version - full ADX calculation is more complex
    const avgTR = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period
    const avgPlusDM = plusDM.slice(-period).reduce((a, b) => a + b, 0) / period
    const avgMinusDM = minusDM.slice(-period).reduce((a, b) => a + b, 0) / period

    const plusDI = (avgPlusDM / avgTR) * 100
    const minusDI = (avgMinusDM / avgTR) * 100

    return (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100
  }

  static generateTradingSignals(
    indicators: TechnicalIndicators,
    currentPrice: number,
  ): {
    signal: "BUY" | "SELL" | "HOLD"
    strength: number
    reasons: string[]
  } {
    const reasons: string[] = []
    let bullishSignals = 0
    let bearishSignals = 0

    // RSI signals
    if (indicators.rsi < 30) {
      bullishSignals++
      reasons.push("RSI oversold (< 30)")
    } else if (indicators.rsi > 70) {
      bearishSignals++
      reasons.push("RSI overbought (> 70)")
    }

    // MACD signals
    if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
      bullishSignals++
      reasons.push("MACD bullish crossover")
    } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
      bearishSignals++
      reasons.push("MACD bearish crossover")
    }

    // Bollinger Bands signals
    if (currentPrice < indicators.bollingerBands.lower) {
      bullishSignals++
      reasons.push("Price below lower Bollinger Band")
    } else if (currentPrice > indicators.bollingerBands.upper) {
      bearishSignals++
      reasons.push("Price above upper Bollinger Band")
    }

    // Stochastic signals
    if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
      bullishSignals++
      reasons.push("Stochastic oversold")
    } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
      bearishSignals++
      reasons.push("Stochastic overbought")
    }

    // ADX trend strength
    if (indicators.adx > 25) {
      reasons.push(`Strong trend (ADX: ${indicators.adx.toFixed(1)})`)
    }

    const totalSignals = bullishSignals + bearishSignals
    const strength = totalSignals > 0 ? Math.abs(bullishSignals - bearishSignals) / totalSignals : 0

    let signal: "BUY" | "SELL" | "HOLD" = "HOLD"
    if (bullishSignals > bearishSignals && strength > 0.3) {
      signal = "BUY"
    } else if (bearishSignals > bullishSignals && strength > 0.3) {
      signal = "SELL"
    }

    return { signal, strength, reasons }
  }
}
