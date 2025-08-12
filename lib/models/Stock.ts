import type { ObjectId } from "mongodb"

export interface Stock {
  _id?: ObjectId
  symbol: string
  name: string
  sector: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  lastUpdated: Date
  historicalData: HistoricalPrice[]
  technicalIndicators: {
    sma20: number
    sma50: number
    rsi: number
    macd: number
  }
}

export interface HistoricalPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}
