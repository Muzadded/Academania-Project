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

class MeetingSlotDto {
  @IsDateString()
  preferredAt!: string;

  @IsNumber()
  @Min(1)
  priority!: number;
}

export class CreateOrderDto {
  @IsString()
  serviceId!: string;

  @IsString()
  clientName!: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsString()
  university!: string;

  @IsNumber()
  @Min(0)
  budget!: number;

  @IsDateString()
  deadline!: string;

  @IsString()
  description!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingSlotDto)
  meetingSlots!: MeetingSlotDto[];
}
