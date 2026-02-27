import type { ISupabseUser } from "../types/user";
import jwt from "jsonwebtoken";

export function verifyJwt<T = ISupabseUser>(token: string): T | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as T;
  } catch (error) {
    return null;
  }
}
