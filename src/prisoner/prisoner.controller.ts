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
import { PrisonerService } from './prisoner.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CreatePrisonerDTO } from './dto/create-prisoner.dto';
import { UpdatePrisonerDTO } from './dto/update-prisoner.dto';
import { CreatePunishmentDTO } from './dto/create-punishment.dto';

@UseGuards(RolesGuard)
@Controller('api/prisoner')
@UseInterceptors(ClassSerializerInterceptor)
export class PrisonerController {
  constructor(private prisonerService: PrisonerService) {}

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async createPrisoner(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePrisonerDTO,
  ) {
    return this.prisonerService.createPrisoner(userId, dto);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Get('')
  @HttpCode(HttpStatus.OK)
  async getAllPrisoners(
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
  ) {
    return this.prisonerService.findAllPrisoners(userId, search);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPrisoner(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.prisonerService.findOnePrisoner(userId, id);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updatePrisoner(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePrisonerDTO,
  ) {
    return this.prisonerService.updatePrisoner(userId, id, dto);
  }

  @Roles([UserRole.ADMIN])
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivatePrisoner(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.prisonerService.deactivatePrisoner(userId, id);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Post(':id/punishment')
  @HttpCode(HttpStatus.CREATED)
  async addPunishment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreatePunishmentDTO,
  ) {
    return this.prisonerService.addPunishment(userId, id, dto);
  }
}
