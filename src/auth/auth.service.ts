import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JWTPayload } from './strategies/jwt.strategy';

export interface AuthResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: {
    name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
  };
  expires_in: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // 1. check unique user name

      const user = await queryRunner.manager.findOne(User, {
        where: {
          email: dto.email,
        },
      });

      if (user)
        throw new ConflictException(
          'User with this email already exists. Use different email',
        );

      //2. hash the password

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      //3. Save user

      const createUser = queryRunner.manager.create(User, {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        is_active: dto.is_active,
      });

      await queryRunner.manager.save(User, createUser);

      await queryRunner.commitTransaction();

      return {
        message: 'User registered successfully.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    // find user

    const findUser = await this.userRepo.findOne({
      where: {
        email: dto.email,
      },
    });

    if (!findUser) throw new UnauthorizedException('Invalid Credentials');

    const isPasswordMatch = await bcrypt.compare(
      dto.password,
      findUser.password,
    );

    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid Credentials');

    if (!findUser.is_active)
      throw new UnauthorizedException('User account is blocked. Contact admin');

    return this.generateAuthToken(findUser);
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return {
      message: 'User fetched successfully',
      user,
    };
  }

  async logout(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.refresh_token = null;

    await this.userRepo.save(user);

    return { message: 'Logout successfully' };
  }

  async refreshToken(user: User) {
    return this.generateAuthToken(user);
  }

  private async generateAuthToken(user: User): Promise<AuthResponse> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION') || '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    user.refresh_token = refreshToken;
    await this.userRepo.save(user);

    return {
      message: 'User Logged in successfully',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
      expires_in: 86400,
    };
  }
}
