import { type NextRequest, NextResponse } from "next/server"
import { RealTimeDataService } from "@/lib/realTimeData"

const dataService = new RealTimeDataService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")
    const type = searchParams.get("type") || "quote"

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 })
    }

    switch (type) {
      case "quote":
        const quote = await dataService.getStockQuote(symbol)
        return NextResponse.json(quote)

      case "news":
        const limit = Number.parseInt(searchParams.get("limit") || "10")
        const news = await dataService.getStockNews(symbol, limit)
        return NextResponse.json(news)

      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }
  } catch (error) {
    console.error("Real-time data error:", error)
    return NextResponse.json({ error: "Failed to fetch real-time data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json()

    if (!Array.isArray(symbols)) {
      return NextResponse.json({ error: "Symbols must be an array" }, { status: 400 })
    }

    await dataService.updateStockData(symbols)
    return NextResponse.json({ success: true, message: "Stock data updated" })
  } catch (error) {
    console.error("Update stock data error:", error)
    return NextResponse.json({ error: "Failed to update stock data" }, { status: 500 })
  }
}
