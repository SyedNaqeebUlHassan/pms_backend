import { Module } from '@nestjs/common';
import { GuardService } from './guard.service';
import { GuardController } from './guard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Guard } from 'src/entities/guard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Guard])],
  providers: [GuardService],
  controllers: [GuardController],
})
export class GuardModule {}
