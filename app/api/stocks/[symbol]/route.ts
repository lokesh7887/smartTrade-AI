import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Stock } from "@/lib/models/Stock"
import { RealTimeDataService } from "@/lib/realTimeData"

export async function GET(request: Request, context: { params: Promise<{ symbol: string }> }) {
  try {
    const params = await context.params
    const symbol = params.symbol.toUpperCase()
    const url = new URL(request.url)
    const days = Number.parseInt(url.searchParams.get("days") || "30")

    const db = await getDatabase()
    const stocksCollection = db.collection<Stock>("stocks")

    let stock = await stocksCollection.findOne({ symbol })

    if (!stock) {
      // If stock doesn't exist, create it
      // INR realistic range for NSE large caps
      const basePrice = Math.random() * 2500 + 100
      const historicalData = []
      let currentPrice = basePrice

      for (let i = days; i >= 0; i--) {
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

      const change = currentPrice - basePrice
      const changePercent = (change / basePrice) * 100

      stock = {
        symbol,
        name: `${symbol} Ltd.`,
        sector: "NSE",
        price: Number.parseFloat(currentPrice.toFixed(2)),
        change: Number.parseFloat(change.toFixed(2)),
        changePercent: Number.parseFloat(changePercent.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        marketCap: Math.floor(Math.random() * 1000000000000) + 50000000000,
        lastUpdated: new Date(),
        historicalData,
        technicalIndicators: {
          sma20: currentPrice,
          sma50: currentPrice,
          rsi: 50,
          macd: 0,
        },
      }

      await stocksCollection.insertOne(stock)
    }

    // Prefer live quote for current price if available
    let currentPrice = stock.price
    let change = 0
    let changePercent = 0

    try {
      const rtd = new RealTimeDataService()
      const live = await rtd.getStockQuote(symbol)
      if (live && live.price > 0) {
        currentPrice = live.price
        change = live.change
        changePercent = live.changePercent
      } else {
        const previousPrice = stock.historicalData[stock.historicalData.length - 2]?.close || stock.price
        change = currentPrice - previousPrice
        changePercent = previousPrice ? (change / previousPrice) * 100 : 0
      }
    } catch {
      const previousPrice = stock.historicalData[stock.historicalData.length - 2]?.close || stock.price
      change = currentPrice - previousPrice
      changePercent = previousPrice ? (change / previousPrice) * 100 : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice,
        change: Number.parseFloat(change.toFixed(2)),
        changePercent: Number.parseFloat(changePercent.toFixed(2)),
        historicalData: stock.historicalData.slice(-days),
        technicalIndicators: stock.technicalIndicators,
        lastUpdated: stock.lastUpdated,
      },
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch stock details" }, { status: 500 })
  }
}
