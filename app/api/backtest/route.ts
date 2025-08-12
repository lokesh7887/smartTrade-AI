import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { BacktestEngine } from "@/lib/backtestEngine"
import type { BacktestParams } from "@/types/backtestParams"

export async function POST(request: Request) {
  try {
    const params: BacktestParams = await request.json()

    // Validate required parameters
    if (!params.symbol || !params.strategy || !params.startDate || !params.endDate || !params.initialCapital) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const db = await getDatabase()
    const backtestsCollection = db.collection("backtests")

    const engine = new BacktestEngine()
    const result = engine.runBacktest(params)

    // Store backtest result in MongoDB
    const backtestRecord = {
      userId: new ObjectId("000000000000000000000000"), // Default user
      name: `${params.symbol} ${params.strategy} Backtest`,
      symbol: params.symbol,
      strategy: params.strategy,
      parameters: {
        startDate: params.startDate,
        endDate: params.endDate,
        initialCapital: params.initialCapital,
        ...params.parameters,
      },
      results: {
        finalValue: result.finalValue,
        totalReturn: result.totalReturn,
        totalReturnPercent: result.totalReturnPercent,
        maxDrawdown: result.maxDrawdown,
        sharpeRatio: result.sharpeRatio,
        winRate: result.winRate,
        totalTrades: result.totalTrades,
        avgTradeReturn: result.avgTradeReturn,
        benchmarkReturn: result.benchmarkReturn,
      },
      trades: result.trades,
      equityCurve: result.equityCurve,
      createdAt: new Date(),
    }

    await backtestsCollection.insertOne(backtestRecord)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Backtest error:", error)
    return NextResponse.json({ success: false, error: "Failed to run backtest" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId") || "default"
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    const db = await getDatabase()
    const backtestsCollection = db.collection("backtests")

    const userObjectId = userId === "default" ? new ObjectId("000000000000000000000000") : new ObjectId(userId)

    const backtests = await backtestsCollection
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      data: backtests,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch backtests" }, { status: 500 })
  }
}
