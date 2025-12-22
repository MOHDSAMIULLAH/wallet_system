import * as crypto from "crypto";

/**
 * Hash a password using SHA-256
 * Note: For production, consider using bcrypt or argon2 for better security
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match
 */
export const comparePassword = (password: string, hashedPassword: string): boolean => {
  const hash = hashPassword(password);
  return hash === hashedPassword;
};
