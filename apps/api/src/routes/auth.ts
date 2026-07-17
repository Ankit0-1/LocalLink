import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { createAccessToken } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const authRouter = Router();
const publicRegistrationRoles = [Role.CUSTOMER, Role.VENDOR, Role.DELIVERY_PARTNER] as const;
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  profileImage: true,
  isActive: true,
  verificationStatus: true,
  createdAt: true,
} as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, role = Role.CUSTOMER } = req.body ?? {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!isNonEmptyString(name) || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Name, a valid email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must contain at least 8 characters' });
    }
    if (!publicRegistrationRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid registration role' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'An account already exists for this email' });
    }

    const passwordHash = await bcrypt.hash(password, 15);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        isActive: true,
        phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
      },
      select: safeUserSelect,
    });

    return res.status(201).json({ user, accessToken: createAccessToken(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!isNonEmptyString(normalizedEmail) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { ...safeUserSelect, passwordHash: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'This account is inactive' });
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return res.status(200).json({ user: safeUser, accessToken: createAccessToken(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: safeUserSelect });
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});

export default authRouter;
