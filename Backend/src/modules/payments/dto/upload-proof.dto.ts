import { IsNumber, IsString, Min } from 'class-validator';

export class UploadProofDto {
  @IsString()
  orderId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  method!: string;
}
