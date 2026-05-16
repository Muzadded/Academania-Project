import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('joinOrderRoom')
  handleJoin(@MessageBody() data: { orderId: string }) {
    return { event: 'joined', room: `order_${data.orderId}` };
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { orderId: string; userId: string }) {
    this.server.to(`order_${data.orderId}`).emit('typing', { userId: data.userId });
  }

  emitMessage(orderId: string, payload: unknown) {
    this.server.to(`order_${orderId}`).emit('newMessage', payload);
  }
}
