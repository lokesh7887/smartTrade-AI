import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Stock } from "@/lib/models/Stock"

// Generate realistic stock data and store in MongoDB
const generateAndStoreStockData = async () => {
  const db = await getDatabase()
  const stocksCollection = db.collection<Stock>("stocks")

  const stocksData = [
    { symbol: "RELIANCE", name: "Reliance Industries Ltd.", sector: "Conglomerate" },
    { symbol: "TCS", name: "Tata Consultancy Services Ltd.", sector: "IT Services" },
    { symbol: "INFY", name: "Infosys Ltd.", sector: "IT Services" },
    { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", sector: "Banking" },
    { symbol: "ICICIBANK", name: "ICICI Bank Ltd.", sector: "Banking" },
    { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd.", sector: "FMCG" },
    { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd.", sector: "Banking" },
    { symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd.", sector: "Telecom" },
    { symbol: "ITC", name: "ITC Ltd.", sector: "FMCG" },
    { symbol: "ADANIENT", name: "Adani Enterprises Ltd.", sector: "Conglomerate" },
  ]

  const stocks = stocksData.map((stock) => {
    // INR price ranges typical for NSE large caps
    const basePrice = Math.random() * 2500 + 100 // ₹100 - ₹2600
    const change = (Math.random() - 0.5) * 20
    const changePercent = (change / basePrice) * 100

    // Generate historical data
    const historicalData = []
    let currentPrice = basePrice
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      const volatility = 0.02
      const randomChange = (Math.random() - 0.5) * 2 * volatility
      currentPrice = currentPrice * (1 + randomChange)

      historicalData.push({
        date: date.toISOString().split("T")[0],
        open: Number.parseFloat((currentPrice * 0.99).toFixed(2)),
        high: Number.parseFloat((currentPrice * 1.02).toFixed(2)),
        low: Number.parseFloat((currentPrice * 0.98).toFixed(2)),
        close: Number.parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 5000000) + 1000000,
      })
    }

    // Calculate technical indicators
    const prices = historicalData.map((d) => d.close)
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length)
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length)

    // Simple RSI calculation
    let gains = 0,
      losses = 0
    for (let i = Math.max(0, prices.length - 14); i < prices.length - 1; i++) {
      const change = prices[i + 1] - prices[i]
      if (change > 0) gains += change
      else losses += Math.abs(change)
    }
    const avgGain = gains / 14
    const avgLoss = losses / 14
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

    return {
      ...stock,
      price: Number.parseFloat(basePrice.toFixed(2)),
      change: Number.parseFloat(change.toFixed(2)),
      changePercent: Number.parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: Math.floor(Math.random() * 10_000_00_00_000) + 50_000_00_00_000, // INR-ish large cap
      lastUpdated: new Date(),
      historicalData,
      technicalIndicators: {
        sma20: Number.parseFloat(sma20.toFixed(2)),
        sma50: Number.parseFloat(sma50.toFixed(2)),
        rsi: Number.parseFloat(rsi.toFixed(2)),
        macd: Number.parseFloat((Math.random() * 10 - 5).toFixed(2)),
      },
    }
  })

  // Upsert stocks (update if exists, insert if not)
  for (const stock of stocks) {
    await stocksCollection.replaceOne({ symbol: stock.symbol }, stock, { upsert: true })
  }

  return stocks
}

export async function GET() {
  try {
    const db = await getDatabase()
    const stocksCollection = db.collection<Stock>("stocks")

    // Check if we have recent data (within last hour)
    const recentStock = await stocksCollection.findOne({
      lastUpdated: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    })

    let stockData
    if (!recentStock) {
      // Generate fresh data if none exists or data is old
      stockData = await generateAndStoreStockData()
    } else {
      // Fetch existing data
      stockData = await stocksCollection.find({}).toArray()
    }

    return NextResponse.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch stock data" }, { status: 500 })
  }
}
