import { z } from 'zod';

export const MIN_PASSWORD_LENGTH = 8;

const NAME_REQUIRED_MESSAGE = 'Name is required';
const EMAIL_INVALID_MESSAGE = 'Email is invalid';
const PASSWORD_TOO_SHORT_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
const REFRESH_TOKEN_REQUIRED_MESSAGE = 'Refresh token is required';

const emailSchema = z.email({ error: EMAIL_INVALID_MESSAGE });
const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH, { error: PASSWORD_TOO_SHORT_MESSAGE });

export const registerBodySchema = z.object({
  name: z.string().trim().min(1, { error: NAME_REQUIRED_MESSAGE }),
  email: emailSchema,
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, { error: REFRESH_TOKEN_REQUIRED_MESSAGE }),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;
