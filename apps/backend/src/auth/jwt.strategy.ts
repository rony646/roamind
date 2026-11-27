import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { CurrentUser } from '@roamind/shared';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Env } from '../config/env.js';
import { UsersService } from '../users/users.service.js';

const INVALID_ACCESS_TOKEN_MESSAGE = 'Invalid access token';

type AccessTokenPayload = {
  sub?: unknown;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<Env, true>,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<CurrentUser> {
    if (typeof payload.sub !== 'string') {
      throw new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE);
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE);
    }

    return user;
  }
}
