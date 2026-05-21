import { plainToInstance, Transform, Type } from 'class-transformer';
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

  // multipart/form-data sends this as a JSON string; @Transform parses it and
  // uses plainToInstance so class-validator's whitelist sees MeetingSlotDto
  // instances (not plain objects), which would otherwise flag every property.
  @Transform(({ value }) => {
    let arr = value;
    if (typeof value === 'string') {
      try {
        arr = JSON.parse(value);
      } catch {
        return value;
      }
    }
    if (Array.isArray(arr)) {
      return plainToInstance(MeetingSlotDto, arr);
    }
    return arr;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingSlotDto)
  meetingSlots!: MeetingSlotDto[];
}
