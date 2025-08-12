import type { ObjectId } from "mongodb"

export interface Watchlist {
  _id?: ObjectId
  userId: ObjectId
  name: string
  symbols: WatchlistItem[]
  createdAt: Date
  updatedAt: Date
}

export interface WatchlistItem {
  symbol: string
  addedAt: Date
  notes?: string
  alertPrice?: number
  alertType?: "above" | "below"
}
