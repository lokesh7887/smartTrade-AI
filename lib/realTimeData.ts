import { connectToDatabase } from "./mongodb"
import { Stock } from "./models/Stock"

interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
  high52Week: number
  low52Week: number
  timestamp: Date
}

interface NewsItem {
  title: string
  summary: string
  url: string
  sentiment: "positive" | "negative" | "neutral"
  score: number
  publishedAt: Date
  source: string
}

export class RealTimeDataService {
  private alphaVantageKey: string
  private finnhubKey: string
  private newsApiKey: string

  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || ""
    this.finnhubKey = process.env.FINNHUB_API_KEY || ""
    this.newsApiKey = process.env.NEWS_API_KEY || ""
  }

  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
      // Try Yahoo Finance API first (free and reliable)
      const yahooQuote = await this.getYahooQuote(symbol)
      if (yahooQuote) {
        return yahooQuote
      }

      // Try Alpha Vantage if API key is available
      if (this.alphaVantageKey) {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`,
        )
        const data = await response.json()

        if (data["Global Quote"] && data["Global Quote"]["01. symbol"]) {
          const quote = data["Global Quote"]
          return {
            symbol: quote["01. symbol"],
            price: Number.parseFloat(quote["05. price"]),
            change: Number.parseFloat(quote["09. change"]),
            changePercent: Number.parseFloat(quote["10. change percent"].replace("%", "")),
            volume: Number.parseInt(quote["06. volume"]),
            marketCap: 0, // Would need additional API call
            pe: 0, // Would need additional API call
            high52Week: Number.parseFloat(quote["03. high"]),
            low52Week: Number.parseFloat(quote["04. low"]),
            timestamp: new Date(),
          }
        }
      }

      // Fallback to Finnhub if API key is available
      if (this.finnhubKey) {
        return await this.getFinnhubQuote(symbol)
      }

      return null
    } catch (error) {
      console.error("Error fetching stock quote:", error)
      return null
    }
  }

  private async getYahooQuote(symbol: string): Promise<StockQuote | null> {
    try {
      // Map symbols to Yahoo Finance format
      const yahooSymbol = this.mapToYahooSymbol(symbol)
      
      // Yahoo Finance API (free alternative)
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      )
      const data = await response.json()

      if (data.chart?.result?.[0]) {
        const result = data.chart.result[0]
        const meta = result.meta
        
        if (meta && meta.regularMarketPrice) {
          const currentPrice = meta.regularMarketPrice
          const previousClose = meta.previousClose
          const change = currentPrice - previousClose
          const changePercent = (change / previousClose) * 100

          return {
            symbol: symbol, // Return original symbol, not Yahoo format
            price: Number.parseFloat(currentPrice.toFixed(2)),
            change: Number.parseFloat(change.toFixed(2)),
            changePercent: Number.parseFloat(changePercent.toFixed(2)),
            volume: meta.regularMarketVolume || 0,
            marketCap: meta.marketCap || 0,
            pe: meta.trailingPE || 0,
            high52Week: meta.fiftyTwoWeekHigh || 0,
            low52Week: meta.fiftyTwoWeekLow || 0,
            timestamp: new Date(),
          }
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching Yahoo quote:", error)
      return null
    }
  }

  private mapToYahooSymbol(symbol: string): string {
    // Indian stocks mapping (NSE)
    const indianStocks = {
      'RELIANCE': 'RELIANCE.NS',
      'TCS': 'TCS.NS',
      'INFY': 'INFY.NS',
      'HDFCBANK': 'HDFCBANK.NS',
      'ICICIBANK': 'ICICIBANK.NS',
      'ITC': 'ITC.NS',
      'SBIN': 'SBIN.NS',
      'BHARTIARTL': 'BHARTIARTL.NS',
      'HINDUNILVR': 'HINDUNILVR.NS',
      'KOTAKBANK': 'KOTAKBANK.NS'
    }

    // Return mapped symbol for Indian stocks, otherwise return as-is for US stocks
    return indianStocks[symbol as keyof typeof indianStocks] || symbol
  }

  private async getFinnhubQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubKey}`)
      const data = await response.json()

      if (data.c && data.c > 0) {
        return {
          symbol,
          price: data.c,
          change: data.d,
          changePercent: data.dp,
          volume: 0, // Not provided in this endpoint
          marketCap: 0,
          pe: 0,
          high52Week: data.h,
          low52Week: data.l,
          timestamp: new Date(data.t * 1000),
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching Finnhub quote:", error)
      return null
    }
  }

  async getStockNews(symbol: string, limit = 10): Promise<NewsItem[]> {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${symbol}&sortBy=publishedAt&pageSize=${limit}&apiKey=${this.newsApiKey}`,
      )
      const data = await response.json()

      if (data.articles) {
        return await Promise.all(
          data.articles.map(async (article: any) => ({
            title: article.title,
            summary: article.description || "",
            url: article.url,
            sentiment: await this.analyzeSentiment(article.title + " " + article.description),
            score: Math.random() * 2 - 1, // Mock sentiment score
            publishedAt: new Date(article.publishedAt),
            source: article.source.name,
          })),
        )
      }

      return []
    } catch (error) {
      console.error("Error fetching stock news:", error)
      return []
    }
  }

  private async analyzeSentiment(text: string): Promise<"positive" | "negative" | "neutral"> {
    // Simple sentiment analysis - in production, use a proper service
    const positiveWords = ["gain", "rise", "up", "bull", "profit", "growth", "strong", "beat", "exceed"]
    const negativeWords = ["loss", "fall", "down", "bear", "decline", "weak", "miss", "drop", "crash"]

    const lowerText = text.toLowerCase()
    const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length
    const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length

    if (positiveCount > negativeCount) return "positive"
    if (negativeCount > positiveCount) return "negative"
    return "neutral"
  }

  async updateStockData(symbols: string[]): Promise<void> {
    await connectToDatabase()

    for (const symbol of symbols) {
      const quote = await this.getStockQuote(symbol)
      if (quote) {
        await Stock.findOneAndUpdate(
          { symbol },
          {
            $set: {
              currentPrice: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              volume: quote.volume,
              lastUpdated: new Date(),
            },
          },
          { upsert: true },
        )
      }
    }
  }
}
