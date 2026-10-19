import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { IsPastDate } from 'src/common/validators/date.validators';
import { Type } from 'class-transformer';
import { GuardSex } from 'src/entities/guard.entity';

export class UpdateGuardDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsPastDate({ message: 'Date of birth must be a past date.' })
  @IsOptional()
  dob?: string;

  @IsEnum(GuardSex)
  @IsOptional()
  sex?: GuardSex;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  duty_hours?: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'shift_start must be in HH:MM format.' })
  @IsOptional()
  shift_start?: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'shift_end must be in HH:MM format.' })
  @IsOptional()
  shift_end?: string;
}
