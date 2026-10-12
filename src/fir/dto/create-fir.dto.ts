import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsNotFutureDateTime } from 'src/common/validators/date.validators';
import { FirStatus } from 'src/entities/fir.entity';

export class CreateFirDTO {
  // Either prisoner_id OR accused_name must be provided — not both null
  @IsUUID()
  @IsOptional()
  prisoner_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ValidateIf((o) => !o.prisoner_id) // required only when prisoner_id is absent
  accused_name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  police_station: string;

  @IsDateString()
  @IsNotFutureDateTime({
    message: 'Incident date and time cannot be in the future.',
  })
  incident_date_time: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  offense_type: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(FirStatus)
  @IsOptional()
  status?: FirStatus;
}
