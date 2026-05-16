import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
