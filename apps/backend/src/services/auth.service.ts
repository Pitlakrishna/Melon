import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db.service';
import { RegisterInput, LoginInput, AuthUserResponse } from '../models/auth.model';
import { AppError } from '../utils/app-error';

const JWT_SECRET = process.env.JWT_SECRET || 'enterpriseproductionjwtsecretchangekey';
const JWT_EXPIRES_IN = '7d';

let isUserTableChecked = false;

/**
 * Ensure the users table and Role enum exist in PostgreSQL
 * even if prisma db push has not been run yet.
 */
async function ensureUserTable(): Promise<void> {
  if (isUserTableChecked) return;

  try {
    // 1. Create Role enum if missing
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create users table if missing
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `);

    // 3. Create unique index on email
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
    `);

    isUserTableChecked = true;
  } catch (err) {
    console.warn('ensureUserTable warning (may already exist):', (err as any)?.message || err);
    isUserTableChecked = true;
  }
}

export class AuthService {
  /**
   * Register a new user account
   */
  async register(data: RegisterInput): Promise<{ token: string; user: AuthUserResponse }> {
    const email = data.email.toLowerCase().trim();

    await ensureUserTable();

    // Check if user already exists
    let existingUser: any = null;
    if ((prisma as any).user?.findUnique) {
      existingUser = await (prisma as any).user.findUnique({
        where: { email },
      });
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "id", "name", "email" FROM "users" WHERE "email" = ${email} LIMIT 1
      `;
      existingUser = rows[0] || null;
    }

    if (existingUser) {
      throw new AppError('An account with this email already exists. Please log in.', 409);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    let newUser: AuthUserResponse;

    if ((prisma as any).user?.create) {
      const created = await (prisma as any).user.create({
        data: {
          name: data.name.trim(),
          email,
          password: hashedPassword,
          role: 'CUSTOMER',
        },
      });

      newUser = {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        createdAt: created.createdAt,
      };
    } else {
      const newId = randomUUID();
      try {
        await prisma.$executeRaw`
          INSERT INTO "users" ("id", "name", "email", "password", "role", "createdAt", "updatedAt")
          VALUES (${newId}, ${data.name.trim()}, ${email}, ${hashedPassword}, 'CUSTOMER'::"Role", NOW(), NOW())
        `;
      } catch {
        // Fallback in case role is stored as varchar/text without enum
        await prisma.$executeRaw`
          INSERT INTO "users" ("id", "name", "email", "password", "role", "createdAt", "updatedAt")
          VALUES (${newId}, ${data.name.trim()}, ${email}, ${hashedPassword}, 'CUSTOMER', NOW(), NOW())
        `;
      }

      newUser = {
        id: newId,
        name: data.name.trim(),
        email,
        role: 'CUSTOMER',
        createdAt: new Date(),
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: newUser,
    };
  }

  /**
   * Authenticate an existing user
   */
  async login(data: LoginInput): Promise<{ token: string; user: AuthUserResponse }> {
    const email = data.email.toLowerCase().trim();

    await ensureUserTable();

    let user: any = null;
    if ((prisma as any).user?.findUnique) {
      user = await (prisma as any).user.findUnique({
        where: { email },
      });
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "id", "name", "email", "password", "role", "createdAt" FROM "users" WHERE "email" = ${email} LIMIT 1
      `;
      user = rows[0] || null;
    }

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    const userResponse: AuthUserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    const token = jwt.sign(
      {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: userResponse,
    };
  }

  /**
   * Retrieve current user profile by ID
   */
  async getCurrentUser(userId: string): Promise<AuthUserResponse> {
    await ensureUserTable();

    let user: any = null;
    if ((prisma as any).user?.findUnique) {
      user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "id", "name", "email", "role", "createdAt" FROM "users" WHERE "id" = ${userId} LIMIT 1
      `;
      user = rows[0] || null;
    }

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();

