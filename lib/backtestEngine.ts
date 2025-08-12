export interface BacktestParams {
  symbol: string
  strategy: "buy_and_hold" | "moving_average" | "rsi_strategy" | "momentum"
  startDate: string
  endDate: string
  initialCapital: number
  parameters?: {
    shortMA?: number
    longMA?: number
    rsiPeriod?: number
    rsiOverbought?: number
    rsiOversold?: number
    momentumPeriod?: number
  }
}

export interface BacktestResult {
  symbol: string
  strategy: string
  startDate: string
  endDate: string
  initialCapital: number
  finalValue: number
  totalReturn: number
  totalReturnPercent: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  totalTrades: number
  avgTradeReturn: number
  trades: Trade[]
  equityCurve: EquityPoint[]
  benchmarkReturn: number
}

export interface Trade {
  date: string
  type: "BUY" | "SELL"
  price: number
  shares: number
  value: number
  reason: string
}

export interface EquityPoint {
  date: string
  portfolioValue: number
  benchmarkValue: number
}

export class BacktestEngine {
  private generateHistoricalData(symbol: string, startDate: string, endDate: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const data = []
    let currentPrice = 100 + Math.random() * 200 // Random starting price

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue

      // Simulate realistic price movement
      const volatility = 0.02
      const drift = 0.0003 // Small positive drift
      const randomChange = (Math.random() - 0.5) * 2 * volatility + drift
      currentPrice = currentPrice * (1 + randomChange)

      data.push({
        date: date.toISOString().split("T")[0],
        open: Number.parseFloat((currentPrice * 0.999).toFixed(2)),
        high: Number.parseFloat((currentPrice * 1.01).toFixed(2)),
        low: Number.parseFloat((currentPrice * 0.99).toFixed(2)),
        close: Number.parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 5000000) + 1000000,
      })
    }

    return data
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma = []
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(null)
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
        sma.push(sum / period)
      }
    }
    return sma
  }

  private calculateRSI(prices: number[], period = 14): number[] {
    const rsi = []
    const gains = []
    const losses = []

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? Math.abs(change) : 0)
    }

    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        rsi.push(null)
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period

        if (avgLoss === 0) {
          rsi.push(100)
        } else {
          const rs = avgGain / avgLoss
          rsi.push(100 - 100 / (1 + rs))
        }
      }
    }

    return [null, ...rsi] // Add null for first price point
  }

  runBacktest(params: BacktestParams): BacktestResult {
    const historicalData = this.generateHistoricalData(params.symbol, params.startDate, params.endDate)
    const prices = historicalData.map((d) => d.close)

    const cash = params.initialCapital
    const shares = 0
    const trades: Trade[] = []
    const equityCurve: EquityPoint[] = []

    // Calculate benchmark (buy and hold)
    const benchmarkShares = params.initialCapital / prices[0]
    const benchmarkFinalValue = benchmarkShares * prices[prices.length - 1]
    const benchmarkReturn = ((benchmarkFinalValue - params.initialCapital) / params.initialCapital) * 100

    // Strategy implementation
    switch (params.strategy) {
      case "buy_and_hold":
        this.executeBuyAndHold(historicalData, cash, shares, trades, equityCurve, params.initialCapital)
        break
      case "moving_average":
        this.executeMovingAverageStrategy(historicalData, prices, cash, shares, trades, equityCurve, params)
        break
      case "rsi_strategy":
        this.executeRSIStrategy(historicalData, prices, cash, shares, trades, equityCurve, params)
        break
      case "momentum":
        this.executeMomentumStrategy(historicalData, prices, cash, shares, trades, equityCurve, params)
        break
    }

    // Calculate final metrics
    const finalValue = equityCurve[equityCurve.length - 1]?.portfolioValue || params.initialCapital
    const totalReturn = finalValue - params.initialCapital
    const totalReturnPercent = (totalReturn / params.initialCapital) * 100

    // Calculate max drawdown
    let maxDrawdown = 0
    let peak = params.initialCapital
    for (const point of equityCurve) {
      if (point.portfolioValue > peak) peak = point.portfolioValue
      const drawdown = ((peak - point.portfolioValue) / peak) * 100
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }

    // Calculate Sharpe ratio (simplified)
    const returns = equityCurve
      .map((point, i) =>
        i === 0 ? 0 : (point.portfolioValue - equityCurve[i - 1].portfolioValue) / equityCurve[i - 1].portfolioValue,
      )
      .slice(1)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const returnStd = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length)
    const sharpeRatio = returnStd === 0 ? 0 : (avgReturn / returnStd) * Math.sqrt(252) // Annualized

    // Calculate win rate
    const profitableTrades = trades.filter((trade, i) => {
      if (trade.type === "SELL" && i > 0) {
        const buyTrade = trades[i - 1]
        return trade.price > buyTrade.price
      }
      return false
    }).length
    const totalCompleteTrades = Math.floor(trades.length / 2)
    const winRate = totalCompleteTrades > 0 ? (profitableTrades / totalCompleteTrades) * 100 : 0

    const avgTradeReturn = totalCompleteTrades > 0 ? totalReturnPercent / totalCompleteTrades : 0

    return {
      symbol: params.symbol,
      strategy: params.strategy,
      startDate: params.startDate,
      endDate: params.endDate,
      initialCapital: params.initialCapital,
      finalValue: Number.parseFloat(finalValue.toFixed(2)),
      totalReturn: Number.parseFloat(totalReturn.toFixed(2)),
      totalReturnPercent: Number.parseFloat(totalReturnPercent.toFixed(2)),
      maxDrawdown: Number.parseFloat(maxDrawdown.toFixed(2)),
      sharpeRatio: Number.parseFloat(sharpeRatio.toFixed(3)),
      winRate: Number.parseFloat(winRate.toFixed(1)),
      totalTrades: trades.length,
      avgTradeReturn: Number.parseFloat(avgTradeReturn.toFixed(2)),
      trades,
      equityCurve,
      benchmarkReturn: Number.parseFloat(benchmarkReturn.toFixed(2)),
    }
  }

  private executeBuyAndHold(
    historicalData: any[],
    cash: number,
    shares: number,
    trades: Trade[],
    equityCurve: EquityPoint[],
    initialCapital: number,
  ) {
    const firstPrice = historicalData[0].close
    shares = cash / firstPrice

    trades.push({
      date: historicalData[0].date,
      type: "BUY",
      price: firstPrice,
      shares,
      value: cash,
      reason: "Buy and hold strategy - initial purchase",
    })

    historicalData.forEach((data, i) => {
      const portfolioValue = shares * data.close
      const benchmarkValue = (initialCapital / firstPrice) * data.close

      equityCurve.push({
        date: data.date,
        portfolioValue,
        benchmarkValue,
      })
    })
  }

  private executeMovingAverageStrategy(
    historicalData: any[],
    prices: number[],
    cash: number,
    shares: number,
    trades: Trade[],
    equityCurve: EquityPoint[],
    params: BacktestParams,
  ) {
    const shortMA = params.parameters?.shortMA || 10
    const longMA = params.parameters?.longMA || 30

    const shortSMA = this.calculateSMA(prices, shortMA)
    const longSMA = this.calculateSMA(prices, longMA)
    const firstPrice = prices[0]

    historicalData.forEach((data, i) => {
      const currentPrice = data.close
      const shortMAValue = shortSMA[i]
      const longMAValue = longSMA[i]

      if (shortMAValue && longMAValue) {
        // Buy signal: short MA crosses above long MA
        if (shortMAValue > longMAValue && shares === 0 && cash > currentPrice) {
          shares = Math.floor(cash / currentPrice)
          cash -= shares * currentPrice

          trades.push({
            date: data.date,
            type: "BUY",
            price: currentPrice,
            shares,
            value: shares * currentPrice,
            reason: `Short MA (${shortMAValue.toFixed(2)}) > Long MA (${longMAValue.toFixed(2)})`,
          })
        }
        // Sell signal: short MA crosses below long MA
        else if (shortMAValue < longMAValue && shares > 0) {
          cash += shares * currentPrice

          trades.push({
            date: data.date,
            type: "SELL",
            price: currentPrice,
            shares,
            value: shares * currentPrice,
            reason: `Short MA (${shortMAValue.toFixed(2)}) < Long MA (${longMAValue.toFixed(2)})`,
          })

          shares = 0
        }
      }

      const portfolioValue = cash + shares * currentPrice
      const benchmarkValue = (params.initialCapital / firstPrice) * currentPrice

      equityCurve.push({
        date: data.date,
        portfolioValue,
        benchmarkValue,
      })
    })
  }

  private executeRSIStrategy(
    historicalData: any[],
    prices: number[],
    cash: number,
    shares: number,
    trades: Trade[],
    equityCurve: EquityPoint[],
    params: BacktestParams,
  ) {
    const rsiPeriod = params.parameters?.rsiPeriod || 14
    const rsiOverbought = params.parameters?.rsiOverbought || 70
    const rsiOversold = params.parameters?.rsiOversold || 30

    const rsi = this.calculateRSI(prices, rsiPeriod)
    const firstPrice = prices[0]

    historicalData.forEach((data, i) => {
      const currentPrice = data.close
      const rsiValue = rsi[i]

      if (rsiValue) {
        // Buy signal: RSI oversold
        if (rsiValue < rsiOversold && shares === 0 && cash > currentPrice) {
          shares = Math.floor(cash / currentPrice)
          cash -= shares * currentPrice

          trades.push({
            date: data.date,
            type: "BUY",
            price: currentPrice,
            shares,
            value: shares * currentPrice,
            reason: `RSI oversold: ${rsiValue.toFixed(1)} < ${rsiOversold}`,
          })
        }
        // Sell signal: RSI overbought
        else if (rsiValue > rsiOverbought && shares > 0) {
          cash += shares * currentPrice

          trades.push({
            date: data.date,
            type: "SELL",
            price: currentPrice,
            shares,
            value: shares * currentPrice,
            reason: `RSI overbought: ${rsiValue.toFixed(1)} > ${rsiOverbought}`,
          })

          shares = 0
        }
      }

      const portfolioValue = cash + shares * currentPrice
      const benchmarkValue = (params.initialCapital / firstPrice) * currentPrice

      equityCurve.push({
        date: data.date,
        portfolioValue,
        benchmarkValue,
      })
    })
  }

  private executeMomentumStrategy(
    historicalData: any[],
    prices: number[],
    cash: number,
    shares: number,
    trades: Trade[],
    equityCurve: EquityPoint[],
    params: BacktestParams,
  ) {
    const momentumPeriod = params.parameters?.momentumPeriod || 20
    const firstPrice = prices[0]

    historicalData.forEach((data, i) => {
      const currentPrice = data.close

      if (i >= momentumPeriod) {
        const pastPrice = prices[i - momentumPeriod]
        const momentum = ((currentPrice - pastPrice) / pastPrice) * 100

        // Buy signal: positive momentum > 5%
        if (momentum > 5 && shares === 0 && cash > currentPrice) {
          shares = Math.floor(cash / currentPrice)
          cash -= shares * currentPrice

          trades.push({
            date: data.date,
            type: "BUY",
            price: currentPrice,
            shares,
            value: shares * currentPrice,
            reason: `Positive momentum: ${momentum.toFixed(2)}% over ${momentumPeriod} days`,
          })
        }
        // Sell signal: negative momentum < -3%
        else if (momentum < -3 && shares > 0) {
          cash += shares * currentPrice

          trades.push({
            date: data.date,
            type: "SELL",
            price: currentPrice,
            shares,
            value: shares * currentPrice,
            reason: `Negative momentum: ${momentum.toFixed(2)}% over ${momentumPeriod} days`,
          })

          shares = 0
        }
      }

      const portfolioValue = cash + shares * currentPrice
      const benchmarkValue = (params.initialCapital / firstPrice) * currentPrice

      equityCurve.push({
        date: data.date,
        portfolioValue,
        benchmarkValue,
      })
    })
  }
}
