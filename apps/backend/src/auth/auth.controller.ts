import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  loginBodySchema,
  refreshTokenBodySchema,
  registerBodySchema,
  type AuthTokens,
  type CurrentUser,
  type LoginBody,
  type RefreshTokenBody,
  type RegisterBody,
} from '@roamind/shared';
import { AuthService } from './auth.service.js';
import { CurrentUserParam } from './current-user.decorator.js';
import { Public } from './public.decorator.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerBodySchema)) body: RegisterBody,
  ): Promise<AuthTokens> {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  login(@Body(new ZodValidationPipe(loginBodySchema)) body: LoginBody): Promise<AuthTokens> {
    return this.auth.login(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body(new ZodValidationPipe(refreshTokenBodySchema)) body: RefreshTokenBody,
  ): Promise<AuthTokens> {
    return this.auth.refresh(body);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @Body(new ZodValidationPipe(refreshTokenBodySchema)) body: RefreshTokenBody,
  ): Promise<void> {
    return this.auth.logout(body);
  }

  @Get('me')
  me(@CurrentUserParam() user: CurrentUser): CurrentUser {
    return user;
  }
}
