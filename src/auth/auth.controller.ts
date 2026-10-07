import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/entities/user.entity';

@Controller('api/auth')
@UseInterceptors(ClassSerializerInterceptor) // will ignore excluded fields like password,refresh token
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() // to mark this as public endpoint so handler does not look for tokens
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async registerUser(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@CurrentUser() user: User) {
    return this.authService.refreshToken(user);
  }
}
