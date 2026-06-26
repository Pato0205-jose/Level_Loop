import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';

export type AuthedRequest = Request & { userId: string };
export type MaybeAuthedRequest = Request & { userId?: string };

function getBearerToken(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authorizationHeader.slice('Bearer '.length);
}

function verifyUserId(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getBearerToken(req.headers.authorization);
  if (token) {
    const userId = verifyUserId(token);
    if (userId) {
      (req as MaybeAuthedRequest).userId = userId;
    }
  }
  return next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const userId = verifyUserId(token);

  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  (req as AuthedRequest).userId = userId;
  return next();
}
