import { Injectable } from '@nestjs/common';
import { MessageDto, AuthUser } from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(orderId: string): Promise<MessageDto[]> {
    const messages = await this.prisma.message.findMany({
      where: { orderId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((m) => ({
      id: m.id,
      orderId: m.orderId,
      senderId: m.senderId,
      senderName: m.sender.name,
      content: m.content,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async send(orderId: string, dto: SendMessageDto, user: AuthUser) {
    return this.prisma.message.create({
      data: {
        orderId,
        senderId: user.id,
        content: dto.content,
      },
    });
  }

  async markRead(id: string) {
    return this.prisma.message.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
