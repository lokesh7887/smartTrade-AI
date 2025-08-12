"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Trash2, Star, TrendingUp, TrendingDown, Bell } from "lucide-react"
import { fetchWatchlist, addToWatchlist, removeFromWatchlist, fetchStocks, type Stock } from "@/lib/api"
import LoadingSpinner from "@/components/loading-spinner"

interface WatchlistManagerProps {
  userId?: string
  onStockSelect?: (symbol: string) => void
}

interface WatchlistItem extends Stock {
  addedDate: string
  priceAlert?: number
  notes?: string
}

export default function WatchlistManager({ userId = "default", onStockSelect }: WatchlistManagerProps) {
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [watchlistDetails, setWatchlistDetails] = useState<WatchlistItem[]>([])
  const [allStocks, setAllStocks] = useState<Stock[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [priceAlert, setPriceAlert] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWatchlistData()
  }, [userId])

  const loadWatchlistData = async () => {
    try {
      setLoading(true)
      const [watchlistSymbols, stocksData] = await Promise.all([fetchWatchlist(userId), fetchStocks()])

      setWatchlist(watchlistSymbols)
      setAllStocks(stocksData)

      // Get detailed info for watchlist stocks
      const watchlistStocks = stocksData
        .filter((stock) => watchlistSymbols.includes(stock.symbol))
        .map((stock) => ({
          ...stock,
          addedDate: new Date().toISOString(), // Mock added date
          priceAlert: undefined,
          notes: undefined,
        }))

      setWatchlistDetails(watchlistStocks)
    } catch (error) {
      console.error("Failed to load watchlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWatchlist = async (stock: Stock) => {
    try {
      const updatedWatchlist = await addToWatchlist(stock.symbol, userId)
      setWatchlist(updatedWatchlist)

      const newItem: WatchlistItem = {
        ...stock,
        addedDate: new Date().toISOString(),
        priceAlert: priceAlert ? Number.parseFloat(priceAlert) : undefined,
        notes: notes || undefined,
      }

      setWatchlistDetails((prev) => [...prev, newItem])
      setIsAddDialogOpen(false)
      setSelectedStock(null)
      setPriceAlert("")
      setNotes("")
    } catch (error) {
      console.error("Failed to add to watchlist:", error)
    }
  }

  const handleRemoveFromWatchlist = async (symbol: string) => {
    try {
      const updatedWatchlist = await removeFromWatchlist(symbol, userId)
      setWatchlist(updatedWatchlist)
      setWatchlistDetails((prev) => prev.filter((item) => item.symbol !== symbol))
    } catch (error) {
      console.error("Failed to remove from watchlist:", error)
    }
  }

  const filteredStocks = allStocks.filter(
    (stock) =>
      !watchlist.includes(stock.symbol) &&
      (stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const getPerformanceColor = (changePercent: number) => {
    if (changePercent > 0) return "text-green-400"
    if (changePercent < 0) return "text-red-400"
    return "text-slate-400"
  }

  const getPerformanceIcon = (changePercent: number) => {
    if (changePercent > 0) return <TrendingUp className="h-3 w-3" />
    if (changePercent < 0) return <TrendingDown className="h-3 w-3" />
    return null
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <div className="text-slate-400 mt-2">Loading watchlist...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">My Watchlist</CardTitle>
              <CardDescription className="text-slate-400">
                Track your favorite stocks and set price alerts
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle>Add Stock to Watchlist</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Search and add stocks to your watchlist with optional price alerts
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Stocks</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="search"
                        placeholder="Search by symbol or company name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>

                  {searchQuery && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredStocks.slice(0, 5).map((stock) => (
                        <div
                          key={stock.symbol}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedStock?.symbol === stock.symbol
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-slate-600 hover:border-slate-500"
                          }`}
                          onClick={() => setSelectedStock(stock)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm">{stock.symbol}</div>
                              <div className="text-xs text-slate-400 truncate">{stock.name}</div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="font-semibold text-sm">${stock.price}</div>
                              <div className={`text-xs ${getPerformanceColor(stock.changePercent)}`}>
                                {stock.changePercent > 0 ? "+" : ""}
                                {stock.changePercent.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedStock && (
                    <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="font-semibold">{selectedStock.symbol}</span>
                        <Badge variant="outline" className="text-xs border-slate-600">
                          {selectedStock.sector}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priceAlert">Price Alert (Optional)</Label>
                        <Input
                          id="priceAlert"
                          type="number"
                          placeholder="Set price alert..."
                          value={priceAlert}
                          onChange={(e) => setPriceAlert(e.target.value)}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="Add personal notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>

                      <Button
                        onClick={() => handleAddToWatchlist(selectedStock)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Add to Watchlist
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {watchlistDetails.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No stocks in watchlist</h3>
              <p className="text-slate-500 mb-4 text-sm">Add stocks to track their performance and set alerts</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Stock
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {watchlistDetails.map((item) => (
                <div
                  key={item.symbol}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 md:p-4 rounded-lg bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStockSelect?.(item.symbol)}
                      className="p-1 h-auto flex-shrink-0"
                    >
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-semibold text-white cursor-pointer hover:text-blue-400 text-sm md:text-base"
                          onClick={() => onStockSelect?.(item.symbol)}
                        >
                          {item.symbol}
                        </span>
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                          {item.sector}
                        </Badge>
                        {item.priceAlert && (
                          <Badge variant="outline" className="text-xs text-orange-400 border-orange-600">
                            <Bell className="h-3 w-3 mr-1" />
                            Alert: ${item.priceAlert}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-slate-400 truncate">{item.name}</p>
                      {item.notes && <p className="text-xs text-slate-500 mt-1 truncate">{item.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <div className="font-semibold text-white text-sm md:text-base">${item.price}</div>
                      <div
                        className={`flex items-center gap-1 text-xs md:text-sm ${getPerformanceColor(item.changePercent)}`}
                      >
                        {getPerformanceIcon(item.changePercent)}
                        {item.change >= 0 ? "+" : ""}
                        {item.change} ({item.changePercent}%)
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromWatchlist(item.symbol)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Watchlist Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Stocks</CardTitle>
            <Star className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-white">{watchlistDetails.length}</div>
            <p className="text-xs text-slate-400">In your watchlist</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-white">
              {watchlistDetails.length > 0
                ? `${(watchlistDetails.reduce((sum, item) => sum + item.changePercent, 0) / watchlistDetails.length).toFixed(2)}%`
                : "0%"}
            </div>
            <p className="text-xs text-slate-400">Today's average</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Price Alerts</CardTitle>
            <Bell className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-white">
              {watchlistDetails.filter((item) => item.priceAlert).length}
            </div>
            <p className="text-xs text-slate-400">Active alerts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
