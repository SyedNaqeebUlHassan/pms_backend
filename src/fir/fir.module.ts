import { Module } from '@nestjs/common';
import { FirService } from './fir.service';
import { FirController } from './fir.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Prisoner } from 'src/entities/prisoner.entity';
import { Fir } from 'src/entities/fir.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Prisoner, Fir])],
  providers: [FirService],
  controllers: [FirController],
})
export class FirModule {}
