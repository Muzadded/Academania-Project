import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AuthUser, OrderDetailDto, OrderSummaryDto, UserRole } from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RevisionRequestDto } from './dto/revision-request.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateOrderDto, file?: Express.Multer.File) {
    const referenceNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    let requirementFileUrl: string | undefined;
    if (file) {
      requirementFileUrl = await this.storage.uploadFile(file, 'requirements');
    }

    const order = await this.prisma.order.create({
      data: {
        referenceNumber,
        clientName: dto.clientName,
        university: dto.university,
        budget: dto.budget,
        deadline: new Date(dto.deadline),
        description: dto.description,
        serviceId: dto.serviceId,
        requirementFileUrl,
        statusHistory: {
          create: { status: OrderStatus.RECEIVED, note: 'Order received' },
        },
        meetingSlots: {
          create: dto.meetingSlots.map((slot) => ({
            clientName: dto.clientName,
            clientEmail: dto.clientEmail ?? '',
            preferredAt: new Date(slot.preferredAt),
            priority: slot.priority,
          })),
        },
      },
      include: { service: true },
    });

    // TODO: notify admin + client via email
    return {
      id: order.id,
      referenceNumber: order.referenceNumber,
      message: 'Order submitted successfully',
    };
  }

  async findByClient(clientId: string): Promise<OrderSummaryDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { clientId },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(this.toSummary);
  }

  async findOne(id: string, user: AuthUser): Promise<OrderDetailDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        service: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        deliverables: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (user.role === UserRole.CLIENT && order.clientId !== user.id) {
      throw new ForbiddenException();
    }
    return {
      ...this.toSummary(order),
      clientName: order.clientName,
      university: order.university,
      budget: Number(order.budget),
      description: order.description,
      requirementFileUrl: order.requirementFileUrl,
      assignedTo: order.assigneeId,
      statusHistory: order.statusHistory.map((h) => ({
        id: h.id,
        status: h.status,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
      deliverables: order.deliverables.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        uploadedAt: d.createdAt.toISOString(),
      })),
    };
  }

  async getDeliverables(id: string, user: AuthUser) {
    await this.findOne(id, user);
    return this.prisma.deliverable.findMany({ where: { orderId: id } });
  }

  async requestRevision(id: string, dto: RevisionRequestDto, user: AuthUser) {
    await this.findOne(id, user);
    return this.prisma.order.update({
      where: { id },
      data: { revisionNote: dto.note },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
    await this.prisma.orderStatusHistory.create({
      data: { orderId: id, status: dto.status, note: dto.note },
    });
    // TODO: emit notification + email
    return order;
  }

  private toSummary(order: {
    id: string;
    referenceNumber: string;
    status: OrderStatus;
    deadline: Date;
    createdAt: Date;
    service: { title: string };
  }): OrderSummaryDto {
    return {
      id: order.id,
      referenceNumber: order.referenceNumber,
      status: order.status,
      serviceTitle: order.service.title,
      deadline: order.deadline.toISOString(),
      createdAt: order.createdAt.toISOString(),
    };
  }
}
