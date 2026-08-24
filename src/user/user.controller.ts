import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UpdateUserDTO } from './dto/update-user.dto';

@UseGuards(RolesGuard)
@Controller('api/user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private userService: UserService) {}

  @Roles([UserRole.ADMIN])
  @Get('')
  @HttpCode(HttpStatus.OK)
  async getAllUsers(
    @CurrentUser('id') userId: string,
    @Query('query') query?: string,
  ) {
    return this.userService.getAllUsers(userId, query);
  }

  @Roles([UserRole.ADMIN])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateUserInformation(
    @Param('id') userId: string,
    @Body() dto: UpdateUserDTO,
  ) {
    return this.userService.updateUserInformation(userId, dto);
  }

  @Roles([UserRole.ADMIN])
  @Patch(':id/block')
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @CurrentUser('id') operatorId: string,
    @Param('id') userId: string,
  ) {
    // Prevent user from blocking themselves
    if (operatorId === userId) {
      throw new ForbiddenException('You cannot block your own account');
    }
    return this.userService.blockUser(userId);
  }

  @Roles([UserRole.ADMIN])
  @Patch(':id/unblock')
  @HttpCode(HttpStatus.OK)
  async unblockUser(@Param('id') userId: string) {
    return this.userService.unBlockUser(userId);
  }

  @Roles([UserRole.ADMIN])
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @CurrentUser('id') operatorId: string,
    @Param('id') userId: string,
  ) {
    // Prevent user from deleting themselves
    if (operatorId === userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    return this.userService.deleteUser(userId);
  }
}
