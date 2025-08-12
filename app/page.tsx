"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, BarChart3, Brain, Shield, Eye, EyeOff, AlertTriangle, X } from "lucide-react"
import Dashboard from "@/components/dashboard"
import LoadingSpinner from "@/components/loading-spinner"
import DatabaseTest from "@/components/db-test"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data)
        setIsAuthenticated(true)
        setError(null)
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data)
        setIsAuthenticated(true)
        setError(null)
      } else {
        setError(data.error || "Signup failed")
      }
    } catch (error) {
      console.error("Signup error:", error)
      setError("Signup failed. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  if (isAuthenticated && user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Enhanced mobile-responsive header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
            <h1 className="text-2xl md:text-4xl font-bold text-white">SmartTrade AI</h1>
          </div>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto px-4">
            Advanced AI-powered stock trading predictions and portfolio management
          </p>
        </div>

        {/* Highlights tailored for India market */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-400 mb-2" />
              <CardTitle className="text-white text-lg md:text-xl">AI Predictions for NSE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm md:text-base">
                Focused predictions for selected Indian equities with real-time insights
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-blue-400 mb-2" />
              <CardTitle className="text-white text-lg md:text-xl">Real-time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm md:text-base">
                Interactive charts and real-time data visualization for informed decision making
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-purple-400 mb-2" />
              <CardTitle className="text-white text-lg md:text-xl">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm md:text-base">
                Comprehensive backtesting and risk analysis tools to optimize your trading strategy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced mobile-responsive auth forms */}
        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-red-200 text-sm">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-200 hover:text-white ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="login" className="text-slate-300 data-[state=active]:text-white">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-slate-300 data-[state=active]:text-white">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm onLogin={handleLogin} loading={loading} />
            </TabsContent>

            <TabsContent value="signup">
              <SignupForm onSignup={handleSignup} loading={loading} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Database Test Section */}
        <div className="max-w-md mx-auto mt-8">
          <DatabaseTest />
        </div>
      </div>
    </div>
  )
}

function LoginForm({ onLogin, loading }: { onLogin: (email: string, password: string) => void; loading: boolean }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password)
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Welcome Back</CardTitle>
        <CardDescription className="text-slate-400">Sign in to access your trading dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white pr-10"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:bg-blue-700 text-white transition-colors" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function SignupForm({
  onSignup,
  loading,
}: { onSignup: (name: string, email: string, password: string) => void; loading: boolean }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSignup(name, email, password)
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Create Account</CardTitle>
        <CardDescription className="text-slate-400">Join SmartTrade AI and start trading smarter</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-slate-300">
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-slate-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white pr-10"
                placeholder="Create a password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:bg-blue-700 text-white transition-colors" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
