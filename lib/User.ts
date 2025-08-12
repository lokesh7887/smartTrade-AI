import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  email: string
  password: string // In production, this should be hashed
  name: string
  createdAt: Date
  updatedAt: Date
  portfolio: {
    totalValue: number
    cash: number
    positions: Position[]
  }
  preferences: {
    riskTolerance: "low" | "medium" | "high"
    investmentGoals: string[]
  }
}

export interface Position {
  symbol: string
  shares: number
  averagePrice: number
  currentPrice: number
  totalValue: number
  gainLoss: number
  gainLossPercent: number
}
