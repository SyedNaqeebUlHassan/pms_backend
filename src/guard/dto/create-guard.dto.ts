import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
  IsNumber,
} from 'class-validator';

import { IsAfterTime, IsPastDate } from 'src/common/validators/date.validators';
import { Type } from 'class-transformer';
import { GuardSex } from 'src/entities/guard.entity';

export class CreateGuardDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsPastDate({ message: 'Date of birth must be a past date.' })
  dob: string;

  @IsEnum(GuardSex)
  sex: GuardSex;

  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Type(() => Number)
  duty_hours: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'shift_start must be in HH:MM format.' })
  shift_start: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'shift_end must be in HH:MM format.' })
  @IsAfterTime('shift_start', {
    message: 'shift_end must be later than shift_start.',
  })
  shift_end: string;
}
