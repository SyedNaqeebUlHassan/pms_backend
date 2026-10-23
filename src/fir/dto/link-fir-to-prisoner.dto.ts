import { IsUUID } from 'class-validator';

export class LinkFirToPrisonerDTO {
  @IsUUID()
  prisoner_id: string;
}
