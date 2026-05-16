import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PaymentDto } from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadProofDto } from './dto/upload-proof.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async uploadProof(dto: UploadProofDto, file: Express.Multer.File) {
    const screenshotUrl = await this.storage.uploadFile(file, 'payments');
    return this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        amount: dto.amount,
        method: dto.method,
        screenshotUrl,
        status: PaymentStatus.PENDING_REVIEW,
      },
    });
  }

  async findByOrder(orderId: string): Promise<PaymentDto[]> {
    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      amount: Number(p.amount),
      method: p.method,
      status: p.status,
      screenshotUrl: p.screenshotUrl,
      rejectionReason: p.rejectionReason,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async verify(id: string, dto: VerifyPaymentDto) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.approved ? PaymentStatus.VERIFIED : PaymentStatus.REJECTED,
        rejectionReason: dto.approved ? null : dto.rejectionReason,
      },
    });
  }
}
