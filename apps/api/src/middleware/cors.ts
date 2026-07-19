import type { NextFunction, Request, Response } from 'express';

const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS;

  if (!configuredOrigins) {
    return defaultAllowedOrigins;
  }

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = new Set(getAllowedOrigins());

export function cors(req: Request, res: Response, next: NextFunction) {
  const origin = req.header('origin');

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
}
