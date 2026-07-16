import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';

export type AuthTokenPayload = {
  sub: string;
  role: Role;
};

const jwtSecret: string = process.env.JWT_SECRET ?? '';

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set before starting the API');
}

export function createAccessToken(user: { id: string; role: Role }) {
  return jwt.sign({ role: user.role }, jwtSecret, {
    subject: user.id,
    expiresIn: '1d',
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, jwtSecret);

  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    !Object.values(['CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER', 'ADMIN']).includes(payload.role)
  ) {
    throw new Error('Invalid access token payload');
  }

  return { sub: payload.sub, role: payload.role as Role };
}
