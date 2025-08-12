import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Test the connection by running a simple command
    await db.command({ ping: 1 })
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      database: db.databaseName
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
