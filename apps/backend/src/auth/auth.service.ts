import { createHash, randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokens, LoginBody, RefreshTokenBody, RegisterBody } from '@roamind/shared';
import { argon2id, hash, verify } from 'argon2';
import { eq } from 'drizzle-orm';
import type { Env } from '../config/env.js';
import { DatabaseService } from '../database/database.service.js';
import { refreshTokens } from '../database/schema/index.js';
import { UsersService } from '../users/users.service.js';
import {
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_REFRESH_TOKEN_MESSAGE,
  SIGNUP_CLOSED_MESSAGE,
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_ENCODING,
  REFRESH_TOKEN_HASH_ALGORITHM,
  REFRESH_TOKEN_TTL_MS,
  UNIQUE_VIOLATION_CODE,
} from './auth.constants.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(input: RegisterBody): Promise<AuthTokens> {
    if (!this.config.get('ALLOW_SIGNUP', { infer: true })) {
      throw new ForbiddenException(SIGNUP_CLOSED_MESSAGE);
    }

    const email = input.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
    }

    const passwordHash = await hash(input.password, { type: argon2id });

    try {
      const user = await this.users.create({
        name: input.name,
        email,
        passwordHash,
      });
      return await this.issueTokens(user.id);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
      }
      throw error;
    }
  }

  async login(input: LoginBody): Promise<AuthTokens> {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user || !(await verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.issueTokens(user.id);
  }

  async refresh(input: RefreshTokenBody): Promise<AuthTokens> {
    const [stored] = await this.database.client
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashRefreshToken(input.refreshToken)))
      .returning({
        userId: refreshTokens.userId,
        expiresAt: refreshTokens.expiresAt,
      });

    if (!stored || stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    return this.issueTokens(stored.userId);
  }

  async logout(input: RefreshTokenBody): Promise<void> {
    await this.database.client
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashRefreshToken(input.refreshToken)));
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync({ sub: userId });
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString(REFRESH_TOKEN_ENCODING);
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.database.client.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}

function hashRefreshToken(refreshToken: string): string {
  return createHash(REFRESH_TOKEN_HASH_ALGORITHM).update(refreshToken).digest('hex');
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  if ('code' in error && error.code === UNIQUE_VIOLATION_CODE) {
    return true;
  }

  if ('cause' in error) {
    return isUniqueViolation(error.cause);
  }

  return false;
}
