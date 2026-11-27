import { createHash } from 'node:crypto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../database/database.service.js';
import type { UsersService } from '../users/users.service.js';
import {
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  REFRESH_TOKEN_HASH_ALGORITHM,
  UNIQUE_VIOLATION_CODE,
} from './auth.constants.js';
import { AuthService } from './auth.service.js';

vi.mock('argon2', async () => {
  const actual = await vi.importActual<typeof import('argon2')>('argon2');
  return {
    ...actual,
    hash: vi.fn(),
    verify: vi.fn(),
  };
});

const NAME = 'Ada Lovelace';
const EMAIL = 'Ada@Example.com';
const NORMALIZED_EMAIL = 'ada@example.com';
const PASSWORD = 'password1';
const PASSWORD_HASH = 'hashed-password';
const USER_ID = '6f0b6c9a-1d2e-4f3a-8b7c-9d0e1f2a3b4c';
const ACCESS_TOKEN = 'access-token';
const REFRESH_TOKEN_NOT_STORED_MESSAGE = 'Refresh token was not stored';
const DUPLICATE_EMAIL_CAUSE = 'duplicate';

type StoredRefreshToken = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

function createService() {
  const findByEmail = vi.fn();
  const create = vi.fn();
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn().mockReturnValue({ values });
  const signAsync = vi.fn().mockResolvedValue(ACCESS_TOKEN);
  const service = new AuthService(
    { findByEmail, create } as unknown as UsersService,
    { client: { insert } } as unknown as DatabaseService,
    { signAsync } as unknown as JwtService,
  );

  return { service, findByEmail, create, values, signAsync };
}

function storedToken(values: ReturnType<typeof vi.fn>): StoredRefreshToken {
  const row = values.mock.calls[0]?.[0] as StoredRefreshToken | undefined;
  if (!row) {
    throw new Error(REFRESH_TOKEN_NOT_STORED_MESSAGE);
  }
  return row;
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.mocked(hash).mockReset();
    vi.mocked(verify).mockReset();
  });

  it('registers a user and returns tokens', async () => {
    const { service, findByEmail, create, values, signAsync } = createService();
    findByEmail.mockResolvedValue(undefined);
    vi.mocked(hash).mockResolvedValue(PASSWORD_HASH);
    create.mockResolvedValue({ id: USER_ID, name: NAME, email: NORMALIZED_EMAIL });

    const result = await service.register({ name: NAME, email: EMAIL, password: PASSWORD });

    expect(findByEmail).toHaveBeenCalledWith(NORMALIZED_EMAIL);
    expect(create).toHaveBeenCalledWith({
      name: NAME,
      email: NORMALIZED_EMAIL,
      passwordHash: PASSWORD_HASH,
    });
    expect(signAsync).toHaveBeenCalledWith({ sub: USER_ID });
    expect(result).toEqual({
      accessToken: ACCESS_TOKEN,
      refreshToken: expect.any(String),
    });
    expect(result).not.toHaveProperty('passwordHash');

    const stored = storedToken(values);
    expect(stored.userId).toBe(USER_ID);
    expect(stored.expiresAt).toBeInstanceOf(Date);
    expect(stored.tokenHash).toBe(
      createHash(REFRESH_TOKEN_HASH_ALGORITHM).update(result.refreshToken).digest('hex'),
    );
    expect(stored.tokenHash).not.toBe(result.refreshToken);
  });

  it('rejects a duplicate email', async () => {
    const { service, findByEmail, create } = createService();
    findByEmail.mockResolvedValue({
      id: USER_ID,
      name: NAME,
      email: NORMALIZED_EMAIL,
      passwordHash: PASSWORD_HASH,
    });

    await expect(
      service.register({ name: NAME, email: EMAIL, password: PASSWORD }),
    ).rejects.toThrow(EMAIL_ALREADY_REGISTERED_MESSAGE);
    expect(create).not.toHaveBeenCalled();
    expect(hash).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email reported by the database', async () => {
    const { service, findByEmail, create } = createService();
    findByEmail.mockResolvedValue(undefined);
    vi.mocked(hash).mockResolvedValue(PASSWORD_HASH);
    create.mockRejectedValue(
      new Error(DUPLICATE_EMAIL_CAUSE, { cause: { code: UNIQUE_VIOLATION_CODE } }),
    );

    await expect(
      service.register({ name: NAME, email: EMAIL, password: PASSWORD }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with the right password', async () => {
    const { service, findByEmail, signAsync } = createService();
    findByEmail.mockResolvedValue({
      id: USER_ID,
      name: NAME,
      email: NORMALIZED_EMAIL,
      passwordHash: PASSWORD_HASH,
    });
    vi.mocked(verify).mockResolvedValue(true);

    const result = await service.login({ email: EMAIL, password: PASSWORD });

    expect(findByEmail).toHaveBeenCalledWith(NORMALIZED_EMAIL);
    expect(verify).toHaveBeenCalledWith(PASSWORD_HASH, PASSWORD);
    expect(signAsync).toHaveBeenCalledWith({ sub: USER_ID });
    expect(result.accessToken).toBe(ACCESS_TOKEN);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects a wrong password', async () => {
    const { service, findByEmail } = createService();
    findByEmail.mockResolvedValue({
      id: USER_ID,
      name: NAME,
      email: NORMALIZED_EMAIL,
      passwordHash: PASSWORD_HASH,
    });
    vi.mocked(verify).mockResolvedValue(false);

    await expect(service.login({ email: EMAIL, password: PASSWORD })).rejects.toThrow(
      INVALID_CREDENTIALS_MESSAGE,
    );
  });

  it('rejects an unknown email with the same message as a wrong password', async () => {
    const { service, findByEmail } = createService();
    findByEmail.mockResolvedValue(undefined);

    await expect(service.login({ email: EMAIL, password: PASSWORD })).rejects.toThrow(
      new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE),
    );
    expect(verify).not.toHaveBeenCalled();
  });
});
