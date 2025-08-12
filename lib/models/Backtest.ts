import type { ObjectId } from "mongodb"

export interface Backtest {
  _id?: ObjectId
  userId: ObjectId
  name: string
  symbol: string
  strategy: "buy_and_hold" | "moving_average" | "rsi_strategy" | "momentum"
  parameters: {
    startDate: string
    endDate: string
    initialCapital: number
    shortMA?: number
    longMA?: number
    rsiPeriod?: number
    rsiOverbought?: number
    rsiOversold?: number
    momentumPeriod?: number
  }
  results: {
    finalValue: number
    totalReturn: number
    totalReturnPercent: number
    maxDrawdown: number
    sharpeRatio: number
    winRate: number
    totalTrades: number
    avgTradeReturn: number
    benchmarkReturn: number
  }
  trades: BacktestTrade[]
  equityCurve: EquityPoint[]
  createdAt: Date
}

export interface BacktestTrade {
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
