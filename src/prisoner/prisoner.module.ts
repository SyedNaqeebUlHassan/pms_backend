import { Module } from '@nestjs/common';
import { PrisonerService } from './prisoner.service';
import { PrisonerController } from './prisoner.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Prisoner } from 'src/entities/prisoner.entity';
import { Punishment } from 'src/entities/punishment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Prisoner, Punishment])],
  providers: [PrisonerService],
  controllers: [PrisonerController],
})
export class PrisonerModule {}
