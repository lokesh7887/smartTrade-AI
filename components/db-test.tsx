"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function DatabaseTest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const testConnection = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()

      setResult({
        success: data.success,
        message: data.message || data.error,
        details: data.details
      })
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to test database connection",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Test
        </CardTitle>
        <CardDescription className="text-slate-400">
          Test if MongoDB is properly connected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={testing}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {testing ? "Testing..." : "Test Database Connection"}
        </Button>

        {result && (
          <div className={`p-3 rounded-lg border ${
            result.success 
              ? "bg-green-900/50 border-green-700" 
              : "bg-red-900/50 border-red-700"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                result.success ? "text-green-200" : "text-red-200"
              }`}>
                {result.success ? "Connection Successful" : "Connection Failed"}
              </span>
            </div>
            <p className={`text-sm ${
              result.success ? "text-green-300" : "text-red-300"
            }`}>
              {result.message}
            </p>
            {result.details && (
              <p className="text-xs text-slate-400 mt-1">
                Details: {result.details}
              </p>
            )}
          </div>
        )}

        <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
          <h4 className="text-sm font-medium text-white mb-2">Setup Instructions:</h4>
          <ol className="text-xs text-slate-300 space-y-1">
            <li>1. Create a <code className="bg-slate-600 px-1 rounded">.env.local</code> file in your project root</li>
            <li>2. Add your MongoDB connection string:</li>
            <li className="ml-4">
              <code className="bg-slate-600 px-1 rounded">
                MONGODB_URI=mongodb://localhost:27017/smarttrade_ai
              </code>
            </li>
            <li>3. For MongoDB Atlas, use:</li>
            <li className="ml-4">
              <code className="bg-slate-600 px-1 rounded">
                MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smarttrade_ai
              </code>
            </li>
            <li>4. Restart your development server</li>
            <li>5. Test the connection using the button above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
