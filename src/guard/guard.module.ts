import { Module } from '@nestjs/common';
import { GuardService } from './guard.service';
import { GuardController } from './guard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Guard } from 'src/entities/guard.entity';
import { ActivityLogsModule } from 'src/activity-logs/activity-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Guard]), ActivityLogsModule],
  providers: [GuardService],
  controllers: [GuardController],
})
export class GuardModule {}
