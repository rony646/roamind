import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  loginBodySchema,
  registerBodySchema,
  type AuthTokens,
  type LoginBody,
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
}
