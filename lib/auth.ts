import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface AuthUser {
  userId: string;
  userType: string;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return null;
  }
  return verifyToken(token);
}










