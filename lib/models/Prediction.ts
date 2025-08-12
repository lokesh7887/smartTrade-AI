import type { ObjectId } from "mongodb"

export interface Prediction {
  _id?: ObjectId
  symbol: string
  prediction: "BUY" | "SELL" | "HOLD"
  confidence: number
  targetPrice: number
  stopLoss?: number
  reasoning: string[]
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  timeframe: string
  modelVersion: string
  accuracy?: number
  createdAt: Date
  expiresAt: Date
}
