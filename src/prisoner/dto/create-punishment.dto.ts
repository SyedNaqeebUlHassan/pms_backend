import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsFutureDate } from 'src/common/validators/date.validators';
import { PunishmentStatus } from 'src/entities/punishment.entity';

export class CreatePunishmentDTO {
  @IsDateString()
  start_date: string;

  @IsDateString()
  @IsFutureDate({ message: 'Punishment end date must be a future date.' })
  end_date: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsEnum(PunishmentStatus)
  status: PunishmentStatus;
}
