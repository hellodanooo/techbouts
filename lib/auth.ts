// lib/auth.ts
import bcrypt from 'bcryptjs';

export async function verifyPassword(plainPassword: string, hashedPassword: string | null) {
  if (!hashedPassword) return false;
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 12);
}