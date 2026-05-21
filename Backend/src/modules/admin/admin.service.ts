import { Injectable } from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  AdminAnalyticsDto,
  AdminClientDto,
  OrderStatus as SharedOrderStatus,
  UserRole as SharedUserRole,
} from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AssignOrderDto } from './dto/assign-order.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  getOrders(query: AdminOrderQueryDto) {
    return this.prisma.order.findMany({
      where: {
        status: query.status,
        assigneeId: query.assignee,
        ...(query.search && {
          clientName: { contains: query.search, mode: 'insensitive' },
        }),
        ...(query.deadlineBefore && {
          deadline: { lte: new Date(query.deadlineBefore) },
        }),
      },
      include: { service: true, client: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  assignOrder(id: string, dto: AssignOrderDto) {
    return this.prisma.order.update({
      where: { id },
      data: { assigneeId: dto.assigneeId },
    });
  }

  async uploadDeliverables(orderId: string, files: Express.Multer.File[]) {
    const deliverables = await Promise.all(
      files.map(async (file) => {
        const fileUrl = await this.storage.uploadFile(file, 'deliverables');
        return this.prisma.deliverable.create({
          data: { orderId, fileName: file.originalname, fileUrl },
        });
      }),
    );
    // TODO: notify client
    return deliverables;
  }

  async getClients(): Promise<AdminClientDto[]> {
    const clients = await this.prisma.user.findMany({
      include: {
        orders: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role as unknown as SharedUserRole,
      orderCount: c.orders.length,
      activeOrders: c.orders.filter((o) => o.status !== OrderStatus.DONE).length,
    }));
  }

  async createClient(dto: CreateClientDto) {
    const password = dto.password ?? `Temp@${Date.now().toString(36)}`;
    const passwordHash = await bcrypt.hash(password, 12);
    const role = dto.role ?? UserRole.CLIENT;
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role,
      },
    });
    // TODO: email credentials to client
    const label = role === UserRole.ADMIN ? 'Admin account created' : 'Client account created';
    return { id: user.id, email: user.email, message: label };
  }

  async getAnalytics(): Promise<AdminAnalyticsDto> {
    const [totalOrders, orders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.findMany({ select: { status: true, budget: true } }),
    ]);
    const ordersByStatus = Object.values(SharedOrderStatus).reduce(
      (acc, status) => {
        acc[status] = orders.filter((o) => o.status === status).length;
        return acc;
      },
      {} as Record<SharedOrderStatus, number>,
    );
    return {
      totalOrders,
      activeOrders: orders.filter((o) => o.status !== OrderStatus.DONE).length,
      completedOrders: orders.filter((o) => o.status === OrderStatus.DONE).length,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.budget), 0),
      ordersByStatus,
    };
  }

  getAdminNotifications() {
    return this.prisma.notification.findMany({
      where: { user: { role: UserRole.ADMIN } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
