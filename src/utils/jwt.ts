import jwt from "jsonwebtoken";
import { config } from "../config";

/**
 * Generate a JWT token for a user
 * @param userId - The user's ID
 * @returns The generated JWT token
 */
export const generateToken = (userId: number): string => {
  return jwt.sign(
    { userId }, 
    config.jwt.secret, 
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
};

/**
 * Verify and decode a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded token payload
 */
export const verifyToken = (token: string): { userId: number } => {
  return jwt.verify(token, config.jwt.secret) as { userId: number };
};
