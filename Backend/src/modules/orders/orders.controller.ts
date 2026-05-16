import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@academania/shared';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AuthUser } from '@academania/shared';
import { CreateOrderDto } from './dto/create-order.dto';
import { RevisionRequestDto } from './dto/revision-request.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Body() dto: CreateOrderDto, @UploadedFile() file?: Express.Multer.File) {
    return this.ordersService.create(dto, file);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findByClient(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.findOne(id, user);
  }

  @Get(':id/deliverables')
  @UseGuards(JwtAuthGuard)
  getDeliverables(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.getDeliverables(id, user);
  }

  @Post(':id/revision-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  requestRevision(
    @Param('id') id: string,
    @Body() dto: RevisionRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ordersService.requestRevision(id, dto, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
