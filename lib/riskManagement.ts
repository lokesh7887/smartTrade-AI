export interface RiskMetrics {
  sharpeRatio: number
  maxDrawdown: number
  volatility: number
  beta: number
  alpha: number
  valueAtRisk: number
  expectedShortfall: number
  calmarRatio: number
  sortinoRatio: number
}

export interface PositionSizing {
  recommendedSize: number
  maxRisk: number
  stopLoss: number
  takeProfit: number
  riskRewardRatio: number
}

export class RiskManagementEngine {
  static calculateRiskMetrics(returns: number[], benchmarkReturns: number[] = []): RiskMetrics {
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    const volatility = Math.sqrt(variance) * Math.sqrt(252) // Annualized

    // Sharpe Ratio (assuming risk-free rate of 2%)
    const riskFreeRate = 0.02
    const sharpeRatio = (avgReturn * 252 - riskFreeRate) / volatility

    // Maximum Drawdown
    const cumulativeReturns = returns.reduce((acc, ret, i) => {
      acc.push((acc[i - 1] || 1) * (1 + ret))
      return acc
    }, [] as number[])

    let maxDrawdown = 0
    let peak = cumulativeReturns[0]

    for (const value of cumulativeReturns) {
      if (value > peak) peak = value
      const drawdown = (peak - value) / peak
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }

    // Beta and Alpha (if benchmark provided)
    let beta = 1
    let alpha = 0

    if (benchmarkReturns.length === returns.length) {
      const benchmarkAvg = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length
      const covariance =
        returns.reduce((sum, ret, i) => sum + (ret - avgReturn) * (benchmarkReturns[i] - benchmarkAvg), 0) /
        returns.length
      const benchmarkVariance =
        benchmarkReturns.reduce((sum, ret) => sum + Math.pow(ret - benchmarkAvg, 2), 0) / benchmarkReturns.length

      beta = covariance / benchmarkVariance
      alpha = avgReturn - beta * benchmarkAvg
    }

    // Value at Risk (95% confidence)
    const sortedReturns = [...returns].sort((a, b) => a - b)
    const varIndex = Math.floor(returns.length * 0.05)
    const valueAtRisk = Math.abs(sortedReturns[varIndex])

    // Expected Shortfall (Conditional VaR)
    const tailReturns = sortedReturns.slice(0, varIndex)
    const expectedShortfall = Math.abs(tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length)

    // Calmar Ratio
    const calmarRatio = (avgReturn * 252) / maxDrawdown

    // Sortino Ratio (downside deviation)
    const downside = returns.filter((ret) => ret < 0)
    const downsideVariance = downside.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / downside.length
    const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252)
    const sortinoRatio = (avgReturn * 252 - riskFreeRate) / downsideDeviation

    return {
      sharpeRatio,
      maxDrawdown,
      volatility,
      beta,
      alpha,
      valueAtRisk,
      expectedShortfall,
      calmarRatio,
      sortinoRatio,
    }
  }

  static calculatePositionSize(
    accountBalance: number,
    entryPrice: number,
    stopLoss: number,
    riskPercentage = 0.02, // 2% risk per trade
    confidenceLevel = 0.8,
  ): PositionSizing {
    const riskAmount = accountBalance * riskPercentage
    const priceRisk = Math.abs(entryPrice - stopLoss)
    const recommendedSize = Math.floor(riskAmount / priceRisk)

    // Take profit at 2:1 risk-reward ratio
    const takeProfit = entryPrice + priceRisk * 2 * (entryPrice > stopLoss ? 1 : -1)
    const riskRewardRatio = Math.abs(takeProfit - entryPrice) / priceRisk

    // Adjust for confidence level
    const adjustedSize = Math.floor(recommendedSize * confidenceLevel)

    return {
      recommendedSize: adjustedSize,
      maxRisk: riskAmount,
      stopLoss,
      takeProfit,
      riskRewardRatio,
    }
  }

  static assessPortfolioRisk(
    positions: Array<{
      symbol: string
      quantity: number
      currentPrice: number
      entryPrice: number
      weight: number
    }>,
  ): {
    totalRisk: number
    diversificationScore: number
    concentrationRisk: number
    recommendations: string[]
  } {
    const recommendations: string[] = []

    // Concentration risk - check if any single position is > 10%
    const maxWeight = Math.max(...positions.map((p) => p.weight))
    const concentrationRisk = maxWeight > 0.1 ? maxWeight : 0

    if (concentrationRisk > 0.1) {
      recommendations.push(`High concentration risk: ${(concentrationRisk * 100).toFixed(1)}% in single position`)
    }

    // Diversification score (simplified)
    const numPositions = positions.length
    const diversificationScore = Math.min(numPositions / 10, 1) // Optimal around 10 positions

    if (diversificationScore < 0.5) {
      recommendations.push("Consider adding more positions for better diversification")
    }

    // Total portfolio risk (simplified VaR calculation)
    const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0)
    const unrealizedPnL = positions.reduce((sum, p) => sum + p.quantity * (p.currentPrice - p.entryPrice), 0)
    const totalRisk = Math.abs(unrealizedPnL) / totalValue

    if (totalRisk > 0.05) {
      recommendations.push("Portfolio risk is elevated - consider reducing position sizes")
    }

    return {
      totalRisk,
      diversificationScore,
      concentrationRisk,
      recommendations,
    }
  }

  static generateRiskReport(portfolio: any, riskMetrics: RiskMetrics): string {
    return `
Risk Management Report
=====================

Portfolio Performance:
- Sharpe Ratio: ${riskMetrics.sharpeRatio.toFixed(2)}
- Maximum Drawdown: ${(riskMetrics.maxDrawdown * 100).toFixed(2)}%
- Volatility: ${(riskMetrics.volatility * 100).toFixed(2)}%
- Value at Risk (95%): ${(riskMetrics.valueAtRisk * 100).toFixed(2)}%

Risk Assessment:
${riskMetrics.sharpeRatio > 1 ? "✅ Good risk-adjusted returns" : "⚠️ Poor risk-adjusted returns"}
${riskMetrics.maxDrawdown < 0.1 ? "✅ Acceptable drawdown" : "⚠️ High drawdown risk"}
${riskMetrics.volatility < 0.2 ? "✅ Low volatility" : "⚠️ High volatility"}

Recommendations:
- Maintain position sizes within 2-5% risk per trade
- Diversify across at least 8-12 different positions
- Monitor correlation between positions
- Set stop losses at technical support levels
- Review and rebalance portfolio monthly
    `.trim()
  }
}
