import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@academania/shared';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AssignOrderDto } from './dto/assign-order.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  getOrders(@Query() query: AdminOrderQueryDto) {
    return this.adminService.getOrders(query);
  }

  @Patch('orders/:id/assign')
  assignOrder(@Param('id') id: string, @Body() dto: AssignOrderDto) {
    return this.adminService.assignOrder(id, dto);
  }

  @Post('orders/:id/deliverables')
  @UseInterceptors(FilesInterceptor('files'))
  uploadDeliverables(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.adminService.uploadDeliverables(id, files);
  }

  @Get('clients')
  getClients() {
    return this.adminService.getClients();
  }

  @Post('clients')
  createClient(@Body() dto: CreateClientDto) {
    return this.adminService.createClient(dto);
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('notifications')
  getAdminNotifications() {
    return this.adminService.getAdminNotifications();
  }
}
