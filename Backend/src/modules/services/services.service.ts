import { Injectable } from '@nestjs/common';
import { ServiceDto } from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ServiceDto[]> {
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      icon: s.icon,
      sortOrder: s.sortOrder,
    }));
  }
}
