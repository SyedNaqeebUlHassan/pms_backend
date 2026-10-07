import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { JWTPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret)
      throw new Error('JWT_REFRESH_SECRET not set in environment');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JWTPayload): Promise<User> {
    const authHeader = (req.headers as any)['authorization'] ?? '';
    const refreshToken = authHeader.replace('Bearer ', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) throw new UnauthorizedException('User not found');

    if (!user.refresh_token)
      throw new UnauthorizedException(
        'No refresh token found. Please login again',
      );

    if (user.refresh_token !== refreshToken)
      throw new UnauthorizedException(
        'Refresh token mismatch. Please login again',
      );

    if (!user.is_active)
      throw new UnauthorizedException('User account is blocked. Contact admin');

    return user;
  }
}
