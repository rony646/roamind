import { createHash } from 'node:crypto';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../config/env.js';
import type { DatabaseService } from '../database/database.service.js';
import type { UsersService } from '../users/users.service.js';
import {
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_REFRESH_TOKEN_MESSAGE,
  SIGNUP_CLOSED_MESSAGE,
  REFRESH_TOKEN_HASH_ALGORITHM,
  REFRESH_TOKEN_TTL_MS,
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
const CURRENT_REFRESH_TOKEN = 'current-refresh-token';
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
  const returning = vi.fn().mockResolvedValue([]);
  const where = vi.fn().mockImplementation(() => {
    const query = Promise.resolve(undefined) as Promise<undefined> & {
      returning: typeof returning;
    };
    query.returning = returning;
    return query;
  });
  const remove = vi.fn().mockReturnValue({ where });
  const signAsync = vi.fn().mockResolvedValue(ACCESS_TOKEN);
  const get = vi.fn().mockReturnValue(true);
  const service = new AuthService(
    { findByEmail, create } as unknown as UsersService,
    { client: { insert, delete: remove } } as unknown as DatabaseService,
    { signAsync } as unknown as JwtService,
    { get } as unknown as ConfigService<Env, true>,
  );

  return { service, findByEmail, create, values, signAsync, returning, remove, get };
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

  it('rejects registration when signup is closed', async () => {
    const { service, get, create } = createService();
    get.mockReturnValue(false);

    await expect(
      service.register({ name: NAME, email: EMAIL, password: PASSWORD }),
    ).rejects.toThrow(new ForbiddenException(SIGNUP_CLOSED_MESSAGE));
    expect(create).not.toHaveBeenCalled();
    expect(hash).not.toHaveBeenCalled();
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

  it('rotates a valid refresh token', async () => {
    const { service, returning, values, signAsync } = createService();
    returning.mockResolvedValue([
      { userId: USER_ID, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) },
    ]);

    const result = await service.refresh({ refreshToken: CURRENT_REFRESH_TOKEN });

    expect(signAsync).toHaveBeenCalledWith({ sub: USER_ID });
    expect(result.accessToken).toBe(ACCESS_TOKEN);
    expect(result.refreshToken).not.toBe(CURRENT_REFRESH_TOKEN);
    const stored = storedToken(values);
    expect(stored.userId).toBe(USER_ID);
    expect(stored.tokenHash).toBe(
      createHash(REFRESH_TOKEN_HASH_ALGORITHM).update(result.refreshToken).digest('hex'),
    );
    expect(stored.tokenHash).not.toBe(
      createHash(REFRESH_TOKEN_HASH_ALGORITHM).update(CURRENT_REFRESH_TOKEN).digest('hex'),
    );
  });

  it('rejects an expired refresh token', async () => {
    const { service, returning, values } = createService();
    returning.mockResolvedValue([{ userId: USER_ID, expiresAt: new Date(0) }]);

    await expect(service.refresh({ refreshToken: CURRENT_REFRESH_TOKEN })).rejects.toThrow(
      INVALID_REFRESH_TOKEN_MESSAGE,
    );
    expect(values).not.toHaveBeenCalled();
  });

  it('rejects an unknown refresh token', async () => {
    const { service } = createService();

    await expect(service.refresh({ refreshToken: CURRENT_REFRESH_TOKEN })).rejects.toThrow(
      new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE),
    );
  });

  it('rejects a reused refresh token', async () => {
    const { service, returning } = createService();
    returning
      .mockResolvedValueOnce([
        { userId: USER_ID, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) },
      ])
      .mockResolvedValueOnce([]);

    await service.refresh({ refreshToken: CURRENT_REFRESH_TOKEN });

    await expect(service.refresh({ refreshToken: CURRENT_REFRESH_TOKEN })).rejects.toThrow(
      INVALID_REFRESH_TOKEN_MESSAGE,
    );
  });

  it('deletes the refresh token on logout', async () => {
    const { service, remove } = createService();

    await expect(service.logout({ refreshToken: CURRENT_REFRESH_TOKEN })).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledOnce();

    await expect(service.refresh({ refreshToken: CURRENT_REFRESH_TOKEN })).rejects.toThrow(
      INVALID_REFRESH_TOKEN_MESSAGE,
    );
  });
});
