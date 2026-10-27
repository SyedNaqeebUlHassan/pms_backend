import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ActivityLogsService } from './activity-logs.service';
import { UserRole } from 'src/entities/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@UseGuards(RolesGuard)
@Controller('api/activity-logs')
@UseInterceptors(ClassSerializerInterceptor)
export class ActivityLogsController {
  constructor(private activityService: ActivityLogsService) {}

  @Roles([UserRole.ADMIN, UserRole.JAILOR])
  @Get('')
  @HttpCode(HttpStatus.OK)
  async getActivityLogs(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.activityService.getActivityLogs(userId, page, limit);
  }
}
