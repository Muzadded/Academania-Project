import { Injectable } from '@nestjs/common';
import { ContactInquiryResponse } from '@academania/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactDto): Promise<ContactInquiryResponse> {
    const inquiry = await this.prisma.contactInquiry.create({ data: dto });
    // TODO: send auto-reply email via mail service
    return {
      id: inquiry.id,
      message: 'Thank you for contacting us. We will respond shortly.',
    };
  }
}
