import { type NextRequest, NextResponse } from "next/server"
import { RiskManagementEngine } from "@/lib/riskManagement"

export async function POST(request: NextRequest) {
  try {
    const { returns, benchmarkReturns, portfolio, accountBalance } = await request.json()

    // Calculate risk metrics
    const riskMetrics = RiskManagementEngine.calculateRiskMetrics(returns, benchmarkReturns)

    // Assess portfolio risk if portfolio data provided
    let portfolioRisk = null
    if (portfolio && Array.isArray(portfolio)) {
      portfolioRisk = RiskManagementEngine.assessPortfolioRisk(portfolio)
    }

    // Generate risk report
    const riskReport = RiskManagementEngine.generateRiskReport(portfolio, riskMetrics)

    return NextResponse.json({
      riskMetrics,
      portfolioRisk,
      riskReport,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Risk analysis error:", error)
    return NextResponse.json({ error: "Failed to perform risk analysis" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entryPrice = Number.parseFloat(searchParams.get("entryPrice") || "0")
    const stopLoss = Number.parseFloat(searchParams.get("stopLoss") || "0")
    const accountBalance = Number.parseFloat(searchParams.get("accountBalance") || "10000")
    const riskPercentage = Number.parseFloat(searchParams.get("riskPercentage") || "0.02")

    if (!entryPrice || !stopLoss) {
      return NextResponse.json({ error: "Entry price and stop loss are required" }, { status: 400 })
    }

    const positionSizing = RiskManagementEngine.calculatePositionSize(
      accountBalance,
      entryPrice,
      stopLoss,
      riskPercentage,
    )

    return NextResponse.json(positionSizing)
  } catch (error) {
    console.error("Position sizing error:", error)
    return NextResponse.json({ error: "Failed to calculate position sizing" }, { status: 500 })
  }
}
