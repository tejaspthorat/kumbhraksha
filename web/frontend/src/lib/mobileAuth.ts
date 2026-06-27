import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface MobileTokenPayload {
  staffId: number;
  role: string;
}

/**
 * Extracts and verifies a JWT from the Authorization header of a mobile request.
 * Returns the decoded payload if valid, or null otherwise.
 */
export function verifyMobileToken(req: NextRequest): MobileTokenPayload | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET!) as MobileTokenPayload;
  } catch {
    return null;
  }
}
