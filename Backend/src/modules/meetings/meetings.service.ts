import { Injectable } from '@nestjs/common';
import { MeetingStatus } from '@prisma/client';
import { AuthUser, MeetingDto, UserRole } from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfirmMeetingDto } from './dto/confirm-meeting.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMeetingDto) {
    const slots = await this.prisma.meetingSlot.createMany({
      data: dto.slots.map((slot) => ({
        orderId: dto.orderId,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        preferredAt: new Date(slot.preferredAt),
        priority: slot.priority,
        notes: dto.notes,
      })),
    });
    return { count: slots.count, message: 'Meeting preferences saved' };
  }

  async findAll(user: AuthUser): Promise<MeetingDto[]> {
    const where = user.role === UserRole.ADMIN ? {} : { clientEmail: user.email };
    const meetings = await this.prisma.meetingSlot.findMany({
      where,
      orderBy: { preferredAt: 'asc' },
    });
    return meetings.map(this.toDto);
  }

  async findByOrder(orderId: string) {
    const meetings = await this.prisma.meetingSlot.findMany({
      where: { orderId },
      orderBy: { priority: 'asc' },
    });
    return meetings.map(this.toDto);
  }

  async confirm(id: string, dto: ConfirmMeetingDto) {
    const slot = await this.prisma.meetingSlot.findUnique({ where: { id: dto.slotId } });
    if (!slot?.orderId) {
      return this.prisma.meetingSlot.update({
        where: { id: dto.slotId },
        data: {
          status: MeetingStatus.CONFIRMED,
          confirmedAt: new Date(),
          meetingLink: dto.meetingLink,
        },
      });
    }
    await this.prisma.meetingSlot.updateMany({
      where: { orderId: slot.orderId, id: { not: dto.slotId } },
      data: { status: MeetingStatus.REJECTED },
    });
    return this.prisma.meetingSlot.update({
      where: { id: dto.slotId },
      data: {
        status: MeetingStatus.CONFIRMED,
        confirmedAt: new Date(),
        meetingLink: dto.meetingLink,
      },
    });
  }

  async addLink(id: string, meetingLink: string) {
    return this.prisma.meetingSlot.update({
      where: { id },
      data: { meetingLink },
    });
  }

  private toDto(m: {
    id: string;
    orderId: string | null;
    status: MeetingStatus;
    preferredAt: Date;
    priority: number;
    confirmedAt: Date | null;
    meetingLink: string | null;
    notes: string | null;
  }): MeetingDto {
    return {
      id: m.id,
      orderId: m.orderId,
      status: m.status,
      preferredAt: m.preferredAt.toISOString(),
      priority: m.priority,
      confirmedAt: m.confirmedAt?.toISOString() ?? null,
      meetingLink: m.meetingLink,
      notes: m.notes,
    };
  }
}
