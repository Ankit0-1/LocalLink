import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../lib/auth.js';

export type AuthenticatedRequest = Request & {
  user?: { id: string; role: Role };
};

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication is required' });
  }

  try {
    const token = verifyAccessToken(authorization.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'This account is unavailable' });
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication is required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }

    return next();
  };
}
