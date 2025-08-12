import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Watchlist, WatchlistItem } from "@/lib/models/Watchlist"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId") || "default"

    const db = await getDatabase()
    const watchlistsCollection = db.collection<Watchlist>("watchlists")

    let watchlist = await watchlistsCollection.findOne({
      userId: userId === "default" ? new ObjectId("000000000000000000000000") : new ObjectId(userId),
    })

    if (!watchlist) {
      // Create default watchlist
      const defaultWatchlist: Watchlist = {
        userId: userId === "default" ? new ObjectId("000000000000000000000000") : new ObjectId(userId),
        name: "My Watchlist",
        symbols: [
          { symbol: "AAPL", addedAt: new Date() },
          { symbol: "GOOGL", addedAt: new Date() },
          { symbol: "MSFT", addedAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await watchlistsCollection.insertOne(defaultWatchlist)
      watchlist = defaultWatchlist
    }

    return NextResponse.json({
      success: true,
      data: watchlist.symbols.map((item) => item.symbol),
      watchlist: watchlist,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch watchlist" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { symbol, userId = "default", notes, alertPrice, alertType } = await request.json()

    if (!symbol) {
      return NextResponse.json({ success: false, error: "Symbol is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const watchlistsCollection = db.collection<Watchlist>("watchlists")

    const userObjectId = userId === "default" ? new ObjectId("000000000000000000000000") : new ObjectId(userId)
    const upperSymbol = symbol.toUpperCase()

    const newItem: WatchlistItem = {
      symbol: upperSymbol,
      addedAt: new Date(),
      notes,
      alertPrice,
      alertType,
    }

    const result = await watchlistsCollection.updateOne(
      { userId: userObjectId },
      {
        $addToSet: { symbols: newItem },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    )

    const updatedWatchlist = await watchlistsCollection.findOne({ userId: userObjectId })

    return NextResponse.json({
      success: true,
      data: updatedWatchlist?.symbols.map((item) => item.symbol) || [],
      watchlist: updatedWatchlist,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ success: false, error: "Failed to add to watchlist" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { symbol, userId = "default" } = await request.json()

    if (!symbol) {
      return NextResponse.json({ success: false, error: "Symbol is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const watchlistsCollection = db.collection<Watchlist>("watchlists")

    const userObjectId = userId === "default" ? new ObjectId("000000000000000000000000") : new ObjectId(userId)

    await watchlistsCollection.updateOne(
      { userId: userObjectId },
      {
        $pull: { symbols: { symbol: symbol.toUpperCase() } },
        $set: { updatedAt: new Date() },
      },
    )

    const updatedWatchlist = await watchlistsCollection.findOne({ userId: userObjectId })

    return NextResponse.json({
      success: true,
      data: updatedWatchlist?.symbols.map((item) => item.symbol) || [],
      watchlist: updatedWatchlist,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ success: false, error: "Failed to remove from watchlist" }, { status: 500 })
  }
}
