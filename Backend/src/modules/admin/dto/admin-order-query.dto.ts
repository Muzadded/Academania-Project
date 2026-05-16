import { OrderStatus } from '@academania/shared';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class AdminOrderQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  deadlineBefore?: string;
}
