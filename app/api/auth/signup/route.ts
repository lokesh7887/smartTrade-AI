import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Connect to database
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)

    // Return user data without password
    const userData = {
      id: result.insertedId.toString(),
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    }

    return NextResponse.json({
      success: true,
      data: userData,
      message: "User registered successfully"
    })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    )
  }
}
