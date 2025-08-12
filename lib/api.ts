// API utility functions for frontend to use

export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  sector: string
  lastUpdated: string
}

export interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
  country: string
  sector: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  currency: string
  lastUpdated: string
}

export interface Prediction {
  symbol: string
  prediction: "BUY" | "SELL" | "HOLD"
  confidence: number
  targetPrice: number
  reasoning: string[]
  timestamp: string
}

export interface HistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Search for stocks globally
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  try {
    const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to search stocks")
    }

    return data.data
  } catch (error) {
    console.error("Error searching stocks:", error)
    throw error
  }
}

// Fetch all stocks
export async function fetchStocks(): Promise<Stock[]> {
  try {
    const response = await fetch("/api/stocks")
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch stocks")
    }

    return data.data
  } catch (error) {
    console.error("Error fetching stocks:", error)
    throw error
  }
}

// Fetch specific stock with historical data
export async function fetchStockDetails(symbol: string, days = 30) {
  try {
    const response = await fetch(`/api/stocks/${symbol}?days=${days}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch stock details")
    }

    return data.data
  } catch (error) {
    console.error("Error fetching stock details:", error)
    throw error
  }
}

// Fetch AI predictions
export async function fetchPredictions(): Promise<Prediction[]> {
  try {
    const response = await fetch("/api/predictions")
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch predictions")
    }

    return data.data
  } catch (error) {
    console.error("Error fetching predictions:", error)
    throw error
  }
}

// Generate prediction for specific symbol
export async function generatePrediction(symbol: string, timeframe = "1D") {
  try {
    const response = await fetch("/api/predictions/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol, timeframe }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to generate prediction")
    }

    return data.data
  } catch (error) {
    console.error("Error generating prediction:", error)
    throw error
  }
}

// Watchlist operations
export async function fetchWatchlist(userId = "default"): Promise<string[]> {
  try {
    const response = await fetch(`/api/watchlist?userId=${userId}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch watchlist")
    }

    return data.data
  } catch (error) {
    console.error("Error fetching watchlist:", error)
    throw error
  }
}

export async function addToWatchlist(symbol: string, userId = "default"): Promise<string[]> {
  try {
    const response = await fetch("/api/watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol, userId }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to add to watchlist")
    }

    return data.data
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    throw error
  }
}

export async function removeFromWatchlist(symbol: string, userId = "default"): Promise<string[]> {
  try {
    const response = await fetch("/api/watchlist", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol, userId }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to remove from watchlist")
    }

    return data.data
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    throw error
  }
}
