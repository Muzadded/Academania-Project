import { IsString, MinLength } from 'class-validator';

export class RevisionRequestDto {
  @IsString()
  @MinLength(10)
  note!: string;
}
