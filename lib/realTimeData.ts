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
      // Try Alpha Vantage first
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`,
      )
      const data = await response.json()

      if (data["Global Quote"]) {
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

      // Fallback to Finnhub
      return await this.getFinnhubQuote(symbol)
    } catch (error) {
      console.error("Error fetching stock quote:", error)
      return null
    }
  }

  private async getFinnhubQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubKey}`)
      const data = await response.json()

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
