import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { FirStatus } from 'src/entities/fir.entity';

export class UpdateFirDTO {
  @IsUUID()
  @IsOptional()
  prisoner_id?: string; // link FIR to a prisoner after the fact

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  accused_name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  police_station?: string;

  @IsDateString()
  @IsOptional()
  incident_date_time?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  offense_type?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsEnum(FirStatus)
  @IsOptional()
  status?: FirStatus;
}
