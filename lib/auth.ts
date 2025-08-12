import jwt from "jsonwebtoken"

const AUTH_COOKIE_NAME = "stai_session"
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-insecure-secret"

interface TokenPayload {
  id: string
  name: string
  email: string
}

export function signAuthToken(payload: TokenPayload, expiresIn: string = "7d"): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn })
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export { AUTH_COOKIE_NAME }