import { IsOptional, IsString, IsUrl } from 'class-validator';

export class ConfirmMeetingDto {
  @IsString()
  slotId!: string;

  @IsOptional()
  @IsUrl()
  meetingLink?: string;
}
