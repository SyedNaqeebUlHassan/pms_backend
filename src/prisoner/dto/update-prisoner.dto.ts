import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrisonerSex } from 'src/entities/prisoner.entity';
import { IsPastDate } from 'src/common/validators/date.validators';
import { UpdatePunishmentItemDTO } from './update-punishment.dto';

export class UpdatePrisonerDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsPastDate({ message: 'Date of birth must be a past date.' })
  @IsOptional()
  dob?: string;

  @IsEnum(PrisonerSex)
  @IsOptional()
  sex?: PrisonerSex;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  crime?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePunishmentItemDTO)
  @IsOptional()
  punishments?: UpdatePunishmentItemDTO[];
}
