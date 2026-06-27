import { Request, Response, NextFunction } from 'express';
import { verifyMobileToken } from '../lib/mobileAuth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

/**
 * Middleware that extracts user context from headers passed by the Next.js API Gateway.
 */
export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }
  req.user = {
    id: userId,
    email: req.headers['x-user-email'] as string | undefined,
    name: req.headers['x-user-name'] as string | undefined,
    role: req.headers['x-user-role'] as string | undefined,
  };
  next();
}

/**
 * Middleware that validates the mobile coordinator's JWT.
 */
export function requireMobileAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const payload = verifyMobileToken(req);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    return;
  }
  req.user = {
    id: String(payload.staffId),
    role: payload.role,
  };
  next();
}
