import jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface MobileTokenPayload {
  staffId: number;
  role: string;
}

export function verifyMobileToken(req: Request): MobileTokenPayload | null {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET!) as MobileTokenPayload;
  } catch {
    return null;
  }
}
