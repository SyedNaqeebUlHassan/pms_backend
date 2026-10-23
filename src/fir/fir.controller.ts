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
import { FirService } from './fir.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { CreateFirDTO } from './dto/create-fir.dto';
import { UpdateFirDTO } from './dto/update-fir.dto';
import { LinkFirToPrisonerDTO } from './dto/link-fir-to-prisoner.dto';

@UseGuards(RolesGuard)
@Controller('api/fir')
@UseInterceptors(ClassSerializerInterceptor)
export class FirController {
  constructor(private firService: FirService) {}

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async createFir(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFirDTO,
  ) {
    return this.firService.createFir(userId, dto);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Get('')
  @HttpCode(HttpStatus.OK)
  async getAllFirs(
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
  ) {
    return this.firService.findAllFirs(userId, search);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOneFir(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.firService.findOneFir(userId, id);
  }

  @Roles([UserRole.ADMIN])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateFir(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFirDTO,
  ) {
    return this.firService.updateFir(userId, id, dto);
  }

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Post(':id/link')
  @HttpCode(HttpStatus.CREATED)
  async linkFirToPrisoner(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: LinkFirToPrisonerDTO,
  ) {
    return this.firService.linkFirToPrisoner(userId, id, dto);
  }
}
