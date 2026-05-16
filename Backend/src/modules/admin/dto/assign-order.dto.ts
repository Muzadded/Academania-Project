import { IsString } from 'class-validator';

export class AssignOrderDto {
  @IsString()
  assigneeId!: string;
}
