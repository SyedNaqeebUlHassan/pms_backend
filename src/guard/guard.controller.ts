import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GuardService } from './guard.service';
import { UserRole } from 'src/entities/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CreateGuardDTO } from './dto/create-guard.dto';
import { UpdateGuardDTO } from './dto/update-guard.dto';

@UseGuards(RolesGuard)
@Controller('api/guard')
@UseInterceptors(ClassSerializerInterceptor)
export class GuardController {
  constructor(private guardService: GuardService) {}

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async createGuard(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGuardDTO,
  ) {
    return this.guardService.createGuard(userId, dto);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Get('')
  @HttpCode(HttpStatus.OK)
  async getAllGuard(
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
  ) {
    return this.guardService.findAllGuards(userId, search);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOneGuard(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.guardService.findOneGuard(userId, id);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateGuard(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGuardDTO,
  ) {
    return this.guardService.updateGuard(userId, id, dto);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateGuard(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.guardService.deactivateGuard(userId, id);
  }
}
