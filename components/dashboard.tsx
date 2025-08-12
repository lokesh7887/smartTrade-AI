"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Brain,
  LogOut,
  Star,
  RefreshCw,
  Menu,
  AlertCircle,
  X,
  Search,
} from "lucide-react"
import { BarChart3, Activity } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import {
  fetchStocks,
  fetchPredictions,
  fetchStockDetails,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  generatePrediction,
  type Stock,
  type Prediction,
  type StockSearchResult,
} from "@/lib/api"
import WatchlistManager from "@/components/watchlist-manager"
import BacktestTool from "@/components/backtest-tool"
import ErrorBoundary from "@/components/error-boundary"
import StockSearch from "@/components/stock-search"
import { cn } from "@/lib/utils"

interface User {
  name: string
  email: string
}

interface DashboardProps {
  user: User
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  // Global stock focus
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [showStockSearch, setShowStockSearch] = useState(false)

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        // Seed server-side data and fetch watchlist
        await fetchStocks()
        const watchlistData = await fetchWatchlist()
        setWatchlist(watchlistData)
      } catch (err) {
        setError("Failed to load initial data. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedStock) {
      loadStockDetails(selectedStock.symbol)
      generateStockPrediction(selectedStock.symbol)
    }
  }, [selectedStock])

  const loadStockDetails = async (symbol: string) => {
    try {
      const details = await fetchStockDetails(symbol, 30)
      setHistoricalData(details.historicalData || [])
    } catch (error) {
      console.error("Failed to load stock details:", error)
    }
  }

  const generateStockPrediction = async (symbol: string) => {
    try {
      const prediction = await generatePrediction(symbol, "1D")
      setPredictions([prediction])
    } catch (error) {
      console.error("Failed to generate prediction:", error)
      setPredictions([])
    }
  }



  const refreshData = async () => {
    if (!selectedStock) return
    
    setRefreshing(true)
    setError(null)
    try {
      await Promise.all([
        loadStockDetails(selectedStock.symbol),
        generateStockPrediction(selectedStock.symbol)
      ])
    } catch (err) {
      setError("Failed to refresh data. Please try again.")
      console.error("Refresh error:", err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleStockSelect = (stock: StockSearchResult) => {
    console.log("Stock selected:", stock)
    setSelectedStock(stock)
    setShowStockSearch(false)
  }

  const toggleWatchlist = async (symbol: string) => {
    try {
      if (watchlist.includes(symbol)) {
        const updatedWatchlist = await removeFromWatchlist(symbol, "default")
        setWatchlist(updatedWatchlist)
      } else {
        const updatedWatchlist = await addToWatchlist(symbol, "default")
        setWatchlist(updatedWatchlist)
      }
    } catch (error) {
      console.error("Failed to update watchlist:", error)
    }
  }

  const portfolioMetrics = {
    totalValue: selectedStock ? selectedStock.price * 10 : 0,
    dayChange: selectedStock ? selectedStock.change * 10 : 0,
    dayChangePercent: selectedStock ? selectedStock.changePercent : 0,
  }

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "INR": return "₹"
      case "USD": return "$"
      case "GBP": return "£"
      case "JPY": return "¥"
      case "HKD": return "HK$"
      case "EUR": return "€"
      default: return "$"
    }
  }

  const formatNumber = (num: number, currency: string) => {
    const symbol = getCurrencySymbol(currency)
    if (currency === "JPY") {
      return `${symbol}${num.toLocaleString()}`
    }
    return `${symbol}${num.toLocaleString()}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading SmartTrade AI...</p>
        </div>
      </div>
    )
  }

  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden text-slate-300 hover:text-white">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-slate-800 border-slate-700 w-72 sm:w-80">
        <div className="flex items-center gap-2 mb-8">
          <Brain className="h-7 w-7 text-blue-400" />
          <h2 className="text-xl font-bold text-white">SmartTrade AI</h2>
        </div>
        <div className="mb-6 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
          <p className="text-sm text-slate-300">Welcome back,</p>
          <p className="font-semibold text-white">{user.name}</p>
          {selectedStock && (
            <p className="text-xs text-slate-400 mt-1">
              Portfolio: {formatNumber(portfolioMetrics.totalValue, selectedStock.currency)}
            </p>
          )}
        </div>
        <nav className="space-y-2 mb-8">
          {[
            { id: "overview", label: "Market Overview", icon: BarChart3 },
            { id: "charts", label: "Interactive Charts", icon: LineChart },
            { id: "predictions", label: "AI Predictions", icon: Brain },
            { id: "watchlist", label: "Watchlist", icon: Star },
            { id: "backtest", label: "Backtesting", icon: Activity },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`w-full justify-start text-left p-3 h-auto ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-5 w-5 mr-3" />
              {tab.label}
            </Button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4 space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing || !selectedStock}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {error && (
          <div className="bg-red-900/50 border-b border-red-700 px-4 py-3">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-200 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <MobileNav />
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400" />
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">SmartTrade AI</h1>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={refreshing || !selectedStock}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent p-2 sm:px-3"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""} sm:mr-2`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <span className="text-slate-300 text-sm hidden lg:inline">Welcome, {user.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hidden md:flex"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          {/* Stock Search Section */}
          <div className="mb-6 md:mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Global Stock Search
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Search for any company worldwide to get AI-powered trading predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StockSearch
                  onStockSelect={handleStockSelect}
                  selectedStock={selectedStock}
                />
              </CardContent>
            </Card>
          </div>

          {selectedStock ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
                <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Portfolio</CardTitle>
                    <DollarSign className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {formatNumber(portfolioMetrics.totalValue, selectedStock.currency)}
                    </div>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      {portfolioMetrics.dayChange >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className={portfolioMetrics.dayChange >= 0 ? "text-green-400" : "text-red-400"}>
                        {portfolioMetrics.dayChange >= 0 ? "+" : ""}
                        {formatNumber(Math.abs(portfolioMetrics.dayChange), selectedStock.currency)} (
                        {Math.abs(portfolioMetrics.dayChangePercent).toFixed(2)}%)
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">AI Accuracy</CardTitle>
                    <Brain className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                      {predictions.length > 0
                        ? `${predictions[0].confidence.toFixed(1)}%`
                        : "87.3%"}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Prediction confidence</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors sm:col-span-2 xl:col-span-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Watchlist</CardTitle>
                    <Star className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{watchlist.length}</div>
                    <p className="text-xs text-slate-400 mt-1">Stocks tracked</p>
                  </CardContent>
                </Card>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
                <div className="overflow-x-auto">
                  <TabsList className="bg-slate-800 border-slate-700 w-full min-w-max flex">
                    <TabsTrigger
                      value="overview"
                      className="text-slate-300 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                    >
                      <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="charts"
                      className="text-slate-300 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                    >
                      <LineChart className="h-4 w-4 mr-1 sm:mr-2" />
                      Charts
                    </TabsTrigger>
                    <TabsTrigger
                      value="predictions"
                      className="text-slate-300 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                    >
                      <Brain className="h-4 w-4 mr-1 sm:mr-2" />
                      AI Predictions
                    </TabsTrigger>
                    <TabsTrigger
                      value="watchlist"
                      className="text-slate-300 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                    >
                      <Star className="h-4 w-4 mr-1 sm:mr-2" />
                      Watchlist
                    </TabsTrigger>
                    <TabsTrigger
                      value="backtest"
                      className="text-slate-300 data-[state=active]:text-white whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                    >
                      <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                      Backtest
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="overview">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">{selectedStock.symbol} Overview ({selectedStock.exchange})</CardTitle>
                      <CardDescription className="text-slate-400">
                        Price and performance metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white text-sm md:text-base">{selectedStock.symbol}</span>
                              <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                                {selectedStock.exchange}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                                {selectedStock.country}
                              </Badge>
                            </div>
                            <p className="text-xs md:text-sm text-slate-400 truncate">{selectedStock.name}</p>
                            <p className="text-xs text-slate-500">{selectedStock.sector}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-white text-sm md:text-base">
                              {formatNumber(selectedStock.price, selectedStock.currency)}
                            </div>
                            <div className={cn(
                              "flex items-center gap-1 text-xs md:text-sm",
                              selectedStock.change >= 0 ? "text-green-400" : "text-red-400"
                            )}>
                              {selectedStock.change >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <span className="whitespace-nowrap">
                                {selectedStock.change >= 0 ? "+" : ""}
                                {formatNumber(Math.abs(selectedStock.change), selectedStock.currency)} ({selectedStock.changePercent.toFixed(2)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="charts">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <CardTitle className="text-white text-sm md:text-base">{selectedStock.symbol} Price Chart</CardTitle>
                            <CardDescription className="text-slate-400 text-xs md:text-sm">
                              30-day price movement ({selectedStock.currency})
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 sm:h-56 md:h-64 lg:h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData}>
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
                              />
                              <Area type="monotone" dataKey="close" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-sm md:text-base">Trading Volume</CardTitle>
                        <CardDescription className="text-slate-400 text-xs md:text-sm">
                          Daily trading volume for {selectedStock.symbol}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 sm:h-56 md:h-64 lg:h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={historicalData}>
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
                              />
                              <Bar dataKey="volume" fill="#10B981" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-700 xl:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-white text-sm md:text-base">Portfolio Performance</CardTitle>
                        <CardDescription className="text-slate-400 text-xs md:text-sm">
                          Your portfolio value over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 sm:h-56 md:h-64 lg:h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={historicalData.map((item, index) => ({
                                ...item,
                                portfolio: item.close * 10,
                              }))}
                            >
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
                              />
                              <Line type="monotone" dataKey="portfolio" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="predictions">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white">AI Trading Predictions</CardTitle>
                      <CardDescription className="text-slate-400">
                        Machine learning powered buy/sell/hold recommendations for {selectedStock.symbol}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 md:space-y-4">
                        {predictions.length > 0 ? (
                          predictions.map((prediction) => (
                            <div
                              key={prediction.symbol}
                              className="p-3 md:p-4 rounded-lg bg-slate-700/30 border border-slate-600"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-white text-base md:text-lg">{prediction.symbol}</span>
                                  <Badge
                                    variant={
                                      prediction.prediction === "BUY"
                                        ? "default"
                                        : prediction.prediction === "SELL"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    className={
                                      prediction.prediction === "BUY"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : prediction.prediction === "SELL"
                                          ? "bg-red-600 hover:bg-red-700"
                                          : "bg-yellow-600 hover:bg-yellow-700"
                                    }
                                  >
                                    {prediction.prediction}
                                  </Badge>
                                </div>
                                <div className="text-left sm:text-right">
                                  <div className="text-white font-semibold text-sm md:text-base">
                                    Target: {formatNumber(prediction.targetPrice, selectedStock.currency)}
                                  </div>
                                  <div className="text-slate-400 text-xs md:text-sm">
                                    Confidence: {prediction.confidence}%
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {prediction.reasoning.map((reason, index) => (
                                  <div key={index} className="text-xs md:text-sm text-slate-300 flex items-start gap-2">
                                    <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="flex-1">{reason}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-400">No predictions available yet. Please wait for AI analysis to complete.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="watchlist">
                  <WatchlistManager
                    userId="default"
                    onStockSelect={(symbol) => {
                      // This would need to be updated to work with the new search system
                      console.log("Stock selected from watchlist:", symbol)
                    }}
                  />
                </TabsContent>
                <TabsContent value="backtest">
                  <BacktestTool selectedStock={selectedStock} />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="text-center py-12">
                <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Stock to Begin</h3>
                <p className="text-slate-400 mb-6">
                  Use the search box above to find any company worldwide and get AI-powered trading predictions
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-500">
                  <span>Try searching for:</span>
                  <span className="text-blue-400">Apple</span>
                  <span className="text-blue-400">Reliance</span>
                  <span className="text-blue-400">Tesla</span>
                  <span className="text-blue-400">Microsoft</span>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
