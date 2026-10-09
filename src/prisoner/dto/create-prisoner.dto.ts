import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PrisonerSex } from 'src/entities/prisoner.entity';
import { CreatePunishmentDTO } from './create-punishment.dto';
import { Type } from 'class-transformer';
import { IsPastDate } from 'src/common/validators/date.validators';

export class CreatePrisonerDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsDateString()
  @IsPastDate({ message: 'Date of birth must be a past date.' })
  dob: string;

  @IsEnum(PrisonerSex)
  sex: PrisonerSex;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  crime: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePunishmentDTO)
  punishments: CreatePunishmentDTO[];
}
