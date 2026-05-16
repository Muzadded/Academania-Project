import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AuthUser } from '@academania/shared';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './chat.service';

@Controller('messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  getHistory(@Param('orderId') orderId: string) {
    return this.chatService.getHistory(orderId);
  }

  @Post(':orderId')
  @UseGuards(JwtAuthGuard)
  send(
    @Param('orderId') orderId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.send(orderId, dto, user);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string) {
    return this.chatService.markRead(id);
  }
}
