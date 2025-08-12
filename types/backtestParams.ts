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
