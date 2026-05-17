import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '@academania/shared';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: AuthUser['role'];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') || 'secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
