import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PunishmentStatus } from 'src/entities/punishment.entity';
import { IsFutureDate } from 'src/common/validators/date.validators';

export class UpdatePunishmentItemDTO {
  @IsUUID()
  @IsNotEmpty()
  id: string; // which punishment to update

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsFutureDate({ message: 'Punishment end date must be a future date.' })
  @IsOptional()
  end_date?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsEnum(PunishmentStatus)
  @IsOptional()
  status?: PunishmentStatus;
}
