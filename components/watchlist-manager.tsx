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
  onStockSelect?: (symbol: string) => void
}

interface WatchlistItem extends Stock {
  addedDate: string
  priceAlert?: number
  notes?: string
}

export default function WatchlistManager({ onStockSelect }: WatchlistManagerProps) {
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
  }, [])

  const loadWatchlistData = async () => {
    try {
      setLoading(true)
      const [watchlistSymbols, stocksData] = await Promise.all([fetchWatchlist(), fetchStocks()])

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
      const updatedWatchlist = await addToWatchlist(stock.symbol)
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
      const updatedWatchlist = await removeFromWatchlist(symbol)
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
                  <div className="relative">
                    <Input
                      placeholder="Search stocks..."
                      className="bg-slate-700 border-slate-600 text-white pr-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => setSelectedStock(stock)}
                      >
                        <div>
                          <div className="font-medium text-white">{stock.name}</div>
                          <div className="text-xs text-slate-400">{stock.symbol}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white">{stock.price.toFixed(2)}</div>
                          <div className={`text-xs ${getPerformanceColor(stock.changePercent)} flex items-center gap-1 justify-end`}>
                            {getPerformanceIcon(stock.changePercent)}
                            {stock.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedStock && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-semibold">{selectedStock.name}</div>
                            <div className="text-sm text-slate-400">{selectedStock.symbol}</div>
                          </div>
                          <Badge variant="secondary" className="bg-slate-600 text-white">
                            {selectedStock.price.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="priceAlert">Price Alert</Label>
                          <div className="relative">
                            <Input
                              id="priceAlert"
                              type="number"
                              placeholder="Enter target price"
                              className="bg-slate-700 border-slate-600 text-white"
                              value={priceAlert}
                              onChange={(e) => setPriceAlert(e.target.value)}
                            />
                            <Bell className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Input
                            id="notes"
                            placeholder="Optional notes"
                            className="bg-slate-700 border-slate-600 text-white"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => selectedStock && handleAddToWatchlist(selectedStock)}>
                          Add to Watchlist
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {watchlist.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-400">Your watchlist is empty. Add stocks to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlistDetails.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div>
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white">{item.price.toFixed(2)}</div>
                    <div className={`text-xs ${getPerformanceColor(item.changePercent)} flex items-center gap-1 justify-end`}>
                      {getPerformanceIcon(item.changePercent)}
                      {item.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => onStockSelect?.(item.symbol)}>
                      View
                    </Button>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => handleRemoveFromWatchlist(item.symbol)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
