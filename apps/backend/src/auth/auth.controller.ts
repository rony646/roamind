import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  loginBodySchema,
  refreshTokenBodySchema,
  registerBodySchema,
  type AuthTokens,
  type LoginBody,
  type RefreshTokenBody,
  type RegisterBody,
} from '@roamind/shared';
import { AuthService } from './auth.service.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerBodySchema)) body: RegisterBody,
  ): Promise<AuthTokens> {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginBodySchema)) body: LoginBody): Promise<AuthTokens> {
    return this.auth.login(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body(new ZodValidationPipe(refreshTokenBodySchema)) body: RefreshTokenBody,
  ): Promise<AuthTokens> {
    return this.auth.refresh(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @Body(new ZodValidationPipe(refreshTokenBodySchema)) body: RefreshTokenBody,
  ): Promise<void> {
    return this.auth.logout(body);
  }
}
