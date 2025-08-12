"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, TrendingDown, DollarSign, Target, BarChart3, AlertTriangle, Search } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import LoadingSpinner from "@/components/loading-spinner"
import StockSearch from "@/components/stock-search"

interface StockSearchResult {
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

interface BacktestParams {
  symbol: string
  strategy: "buy_and_hold" | "moving_average" | "rsi_strategy" | "momentum"
  startDate: string
  endDate: string
  initialCapital: number
  parameters?: {
    shortMA?: number
    longMA?: number
    rsiPeriod?: number
    rsiOverbought?: number
    rsiOversold?: number
    momentumPeriod?: number
  }
}

interface BacktestResult {
  symbol: string
  strategy: string
  startDate: string
  endDate: string
  initialCapital: number
  finalValue: number
  totalReturn: number
  totalReturnPercent: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  totalTrades: number
  avgTradeReturn: number
  trades: any[]
  equityCurve: any[]
  benchmarkReturn: number
}

interface BacktestToolProps {
  selectedStock?: StockSearchResult | null
}

export default function BacktestTool({ selectedStock }: BacktestToolProps) {
  const [backtestStock, setBacktestStock] = useState<StockSearchResult | null>(selectedStock || null)
  const [params, setParams] = useState<BacktestParams>({
    symbol: "",
    strategy: "moving_average",
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    initialCapital: 10000,
    parameters: {
      shortMA: 10,
      longMA: 30,
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      momentumPeriod: 20,
    },
  })

  const [result, setResult] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update symbol when selectedStock changes (from parent component)
  useEffect(() => {
    if (selectedStock) {
      setBacktestStock(selectedStock)
      setParams(prev => ({
        ...prev,
        symbol: selectedStock.symbol
      }))
    }
  }, [selectedStock])

  // Update symbol when backtestStock changes (from local search)
  useEffect(() => {
    if (backtestStock) {
      setParams(prev => ({
        ...prev,
        symbol: backtestStock.symbol
      }))
    }
  }, [backtestStock])

  const handleStockSelect = (stock: StockSearchResult) => {
    setBacktestStock(stock)
    setParams(prev => ({
      ...prev,
      symbol: stock.symbol
    }))
  }

  const runBacktest = async () => {
    if (!backtestStock) {
      setError("Please select a stock first to run backtesting")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/backtest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...params,
          symbol: backtestStock.symbol
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to run backtest")
      }

      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const updateParams = (key: keyof BacktestParams, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const updateStrategyParams = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value },
    }))
  }

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case "buy_and_hold":
        return "Buy at the start and hold until the end"
      case "moving_average":
        return "Buy when short MA crosses above long MA, sell when it crosses below"
      case "rsi_strategy":
        return "Buy when RSI is oversold, sell when RSI is overbought"
      case "momentum":
        return "Buy on positive momentum, sell on negative momentum"
      default:
        return ""
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Strategy Backtesting</CardTitle>
              <CardDescription className="text-slate-400">
                Search for any company and test your trading strategies on historical data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Stock Search Section */}
          <div className="space-y-4">
            <Label className="text-slate-300 text-base font-medium">Select Company for Backtesting</Label>
            <StockSearch 
              onStockSelect={handleStockSelect}
              selectedStock={backtestStock}
              className="w-full"
            />
          </div>

          {!backtestStock && (
            <Card className="bg-slate-700/30 border-slate-600">
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Search for a Company</h3>
                <p className="text-slate-400 mb-4">
                  Use the search box above to find any company, then run backtesting strategies on its historical data
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-500">
                  <span>Try searching for:</span>
                  <span className="text-blue-400">Apple</span>
                  <span className="text-blue-400">Reliance</span>
                  <span className="text-blue-400">Tesla</span>
                  <span className="text-blue-400">Microsoft</span>
                  <span className="text-blue-400">TCS</span>
                </div>
              </CardContent>
            </Card>
          )}

          {backtestStock && (
            <>
              {/* Strategy Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy" className="text-slate-300">
                    Strategy
                  </Label>
                  <Select value={params.strategy} onValueChange={(value: any) => updateParams("strategy", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="buy_and_hold">Buy & Hold</SelectItem>
                      <SelectItem value="moving_average">Moving Average</SelectItem>
                      <SelectItem value="rsi_strategy">RSI Strategy</SelectItem>
                      <SelectItem value="momentum">Momentum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-slate-300">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={params.startDate}
                    onChange={(e) => updateParams("startDate", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-slate-300">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={params.endDate}
                    onChange={(e) => updateParams("endDate", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialCapital" className="text-slate-300">
                    Initial Capital ($)
                  </Label>
                  <Input
                    id="initialCapital"
                    type="number"
                    value={params.initialCapital}
                    onChange={(e) => updateParams("initialCapital", Number(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="1000"
                    step="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Strategy Description</Label>
                  <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                    <p className="text-sm text-slate-400">{getStrategyDescription(params.strategy)}</p>
                  </div>
                </div>
              </div>

              {/* Strategy-specific parameters */}
              {params.strategy === "moving_average" && (
                <div className="space-y-4">
                  <Separator className="bg-slate-600" />
                  <h4 className="text-white font-semibold">Moving Average Parameters</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Short MA Period</Label>
                      <Input
                        type="number"
                        value={params.parameters?.shortMA || 10}
                        onChange={(e) => updateStrategyParams("shortMA", Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                        min="1"
                        max="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Long MA Period</Label>
                      <Input
                        type="number"
                        value={params.parameters?.longMA || 30}
                        onChange={(e) => updateStrategyParams("longMA", Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                        min="1"
                        max="200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {params.strategy === "rsi_strategy" && (
                <div className="space-y-4">
                  <Separator className="bg-slate-600" />
                  <h4 className="text-white font-semibold">RSI Parameters</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">RSI Period</Label>
                      <Input
                        type="number"
                        value={params.parameters?.rsiPeriod || 14}
                        onChange={(e) => updateStrategyParams("rsiPeriod", Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                        min="2"
                        max="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Overbought Level</Label>
                      <Input
                        type="number"
                        value={params.parameters?.rsiOverbought || 70}
                        onChange={(e) => updateStrategyParams("rsiOverbought", Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                        min="50"
                        max="90"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Oversold Level</Label>
                      <Input
                        type="number"
                        value={params.parameters?.rsiOversold || 30}
                        onChange={(e) => updateStrategyParams("rsiOversold", Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                        min="10"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {params.strategy === "momentum" && (
                <div className="space-y-4">
                  <Separator className="bg-slate-600" />
                  <h4 className="text-white font-semibold">Momentum Parameters</h4>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Momentum Period (days)</Label>
                    <Input
                      type="number"
                      value={params.parameters?.momentumPeriod || 20}
                      onChange={(e) => updateStrategyParams("momentumPeriod", Number(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white"
                      min="5"
                      max="100"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button onClick={runBacktest} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Running Backtest...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Backtest on {backtestStock.symbol}
                    </>
                  )}
                </Button>

                {error && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4 md:space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Total Return</CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-white">{formatCurrency(result.totalReturn)}</div>
                <div
                  className={`text-xs md:text-sm ${result.totalReturnPercent >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {result.totalReturnPercent >= 0 ? "+" : ""}
                  {result.totalReturnPercent.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Max Drawdown</CardTitle>
                <TrendingDown className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-red-400">-{result.maxDrawdown.toFixed(2)}%</div>
                <p className="text-xs text-slate-400">Peak-to-trough decline</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Sharpe Ratio</CardTitle>
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-white">{result.sharpeRatio.toFixed(3)}</div>
                <p className="text-xs text-slate-400">Risk-adjusted return</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-slate-300">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold text-white">{result.winRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">{result.totalTrades} total trades</p>
              </CardContent>
            </Card>
          </div>

          {/* Strategy vs Benchmark */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Strategy vs Benchmark Comparison</CardTitle>
              <CardDescription className="text-slate-400">
                Performance comparison against buy-and-hold strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Strategy Return:</span>
                    <Badge
                      variant={result.totalReturnPercent >= 0 ? "default" : "destructive"}
                      className={result.totalReturnPercent >= 0 ? "bg-green-600" : "bg-red-600"}
                    >
                      {result.totalReturnPercent >= 0 ? "+" : ""}
                      {result.totalReturnPercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Benchmark Return:</span>
                    <Badge
                      variant={result.benchmarkReturn >= 0 ? "default" : "destructive"}
                      className={result.benchmarkReturn >= 0 ? "bg-green-600" : "bg-red-600"}
                    >
                      {result.benchmarkReturn >= 0 ? "+" : ""}
                      {result.benchmarkReturn.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Outperformance:</span>
                    <Badge
                      variant={result.totalReturnPercent - result.benchmarkReturn >= 0 ? "default" : "destructive"}
                      className={result.totalReturnPercent - result.benchmarkReturn >= 0 ? "bg-blue-600" : "bg-red-600"}
                    >
                      {result.totalReturnPercent - result.benchmarkReturn >= 0 ? "+" : ""}
                      {(result.totalReturnPercent - result.benchmarkReturn).toFixed(2)}%
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Final Value:</span>
                    <span className="text-white font-semibold text-sm">{formatCurrency(result.finalValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Initial Capital:</span>
                    <span className="text-slate-400 text-sm">{formatCurrency(result.initialCapital)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Avg Trade Return:</span>
                    <span className="text-white text-sm">{result.avgTradeReturn.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Equity Curve Chart */}
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                        fontSize: "12px",
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: any, name: string) => [
                        formatCurrency(value),
                        name === "portfolioValue" ? "Strategy" : "Benchmark",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="portfolioValue"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      name="Strategy"
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmarkValue"
                      stroke="#6B7280"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Benchmark"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trade History */}
          {result.trades.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Trade History</CardTitle>
                <CardDescription className="text-slate-400">
                  Detailed log of all buy and sell transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                  {result.trades.map((trade, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-slate-700/30 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={trade.type === "BUY" ? "default" : "destructive"}
                          className={trade.type === "BUY" ? "bg-green-600" : "bg-red-600"}
                        >
                          {trade.type}
                        </Badge>
                        <div>
                          <div className="text-white font-semibold text-sm">
                            {new Date(trade.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-400">{trade.reason}</div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-white font-semibold text-sm">${trade.price.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">{trade.shares.toFixed(0)} shares</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
