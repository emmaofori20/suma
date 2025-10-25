// Simple PIN hashing utility
// In production, consider using a more robust hashing algorithm

export function hashPin(pin: string, salt: string): string {
  // Simple hash function - in production, use crypto.subtle or a proper hashing library
  const combined = pin + salt;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}

export function generateSalt(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function validatePin(pin: string): boolean {
  // PIN must be 4-6 digits
  return /^\d{4,6}$/.test(pin);
}
