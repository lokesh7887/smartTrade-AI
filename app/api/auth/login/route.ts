import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Find user by email
    const user = await usersCollection.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Return user data without password
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }

    return NextResponse.json({
      success: true,
      data: userData,
      message: "Login successful"
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to authenticate user" },
      { status: 500 }
    )
  }
}
