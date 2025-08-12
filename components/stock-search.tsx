"use client"

import { useState, useEffect, useRef } from "react"
import { Search, TrendingUp, TrendingDown, Globe, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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

interface StockSearchProps {
  onStockSelect: (stock: StockSearchResult) => void
  selectedStock?: StockSearchResult | null
  className?: string
}

export default function StockSearch({ onStockSelect, selectedStock, className }: StockSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search stocks with debouncing
  useEffect(() => {
    const searchStocks = async () => {
      if (!query || query.length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log("Searching for:", query)
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
        console.log("Search response status:", response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log("Search response data:", data)

        if (data.success) {
          console.log("Setting search results:", data.data)
          setResults(data.data)
          setShowResults(true)
        } else {
          console.log("Search failed:", data.error)
          setError(data.error || "Failed to search stocks")
          setResults([])
        }
      } catch (err) {
        console.error("Search error:", err)
        setError("Failed to search stocks")
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(searchStocks, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const handleStockSelect = (stock: StockSearchResult) => {
    console.log("Stock selected in search component:", stock)
    onStockSelect(stock)
    setQuery(stock.name)
    setShowResults(false)
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

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search for any company (e.g., Apple, Reliance, Tesla)..."
          value={query}
          onChange={(e) => {
            console.log("Search input changed:", e.target.value)
            setQuery(e.target.value)
          }}
          className="pl-10 pr-4 h-12 text-base"
          onFocus={() => {
            console.log("Search input focused, query length:", query.length)
            query.length >= 2 && setShowResults(true)
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          </div>
        )}
      </div>

             {/* Search Results Dropdown */}
       {console.log("showResults:", showResults, "results.length:", results.length)}
       {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg border-slate-700 bg-slate-800">
          <CardContent className="p-0">
            {error && (
              <div className="p-4 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {results.length === 0 && !isLoading && query.length >= 2 && !error && (
              <div className="p-4 text-slate-400 text-sm">
                No companies found for "{query}"
              </div>
            )}

            {results.map((stock) => {
              console.log("Rendering stock result:", stock)
              return (
                <div
                  key={`${stock.symbol}-${stock.exchange}`}
                  className="p-4 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700 last:border-b-0 transition-colors"
                  onClick={() => handleStockSelect(stock)}
                >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">
                        {stock.symbol}
                      </span>
                      <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                        {stock.exchange}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                        {stock.country}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm truncate mb-1">
                      {stock.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Building2 className="h-3 w-3" />
                      <span>{stock.sector}</span>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="font-semibold text-white text-sm">
                      {formatNumber(stock.price, stock.currency)}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      stock.change >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {stock.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {stock.change >= 0 ? "+" : ""}
                        {formatNumber(Math.abs(stock.change), stock.currency)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                                 </div>
               </div>
             )
            })}
          </CardContent>
        </Card>
      )}

      {/* Selected Stock Display */}
      {selectedStock && (
        <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-lg">
                  {selectedStock.symbol}
                </span>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                  {selectedStock.exchange}
                </Badge>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                  {selectedStock.country}
                </Badge>
              </div>
              <p className="text-slate-300 text-sm mb-1">
                {selectedStock.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="h-3 w-3" />
                <span>{selectedStock.sector}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-white text-lg">
                {formatNumber(selectedStock.price, selectedStock.currency)}
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm",
                selectedStock.change >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {selectedStock.change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {selectedStock.change >= 0 ? "+" : ""}
                  {formatNumber(Math.abs(selectedStock.change), selectedStock.currency)} ({selectedStock.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
