import { Context } from 'hono';
import {sign, verify} from 'hono/jwt';
import { JWTPayload } from 'hono/utils/jwt/types';


export async function generateToken(userId: string, c:Context) :  Promise<string> {
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT secret is not defined in the environment variables');
    }
    const expirationTime = Math.floor(Date.now() / 1000) + 3600
    const token = await sign({ userId, exp : expirationTime  }, jwtSecret,);
    return token;
}

export async function verifyToken(token: string, c: Context): Promise<JWTPayload> {
    try {
      const jwtSecret = c.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT secret is not defined in the environment variables");
      }
  
      const decoded = await verify(token, jwtSecret);
  
      if (!decoded.userId) {
        throw new Error("Token payload does not contain userId");
      }
  
      if (!decoded.exp) {
        throw new Error("Token payload does not contain exp");
      }
  
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      if (decoded.exp < currentTime) {
        throw new Error("Token has expired");
      }
  
      return decoded;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Token verification failed:", error.message);
        throw new Error(error.message.includes("expired") ? "Token has expired" : "Invalid token");
      }
      throw new Error("An unknown error occurred during token verification");
    }
  }