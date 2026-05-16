import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class SlotDto {
  @IsDateString()
  preferredAt!: string;

  @IsNumber()
  @Min(1)
  priority!: number;
}

export class CreateMeetingDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsString()
  clientName!: string;

  @IsEmail()
  clientEmail!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots!: SlotDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
