import { Injectable, Logger } from '@nestjs/common';
import { ConnectionService } from '../connection/connection.service';
import { Server } from 'socket.io';

@Injectable()
export class WsService {
  private readonly logger = new Logger(WsService.name);
  constructor(private readonly connectionService: ConnectionService) {}

  async handleNewChatMessage(
    server: Server,
    payload: {
      roomId: string;
      data: {
        message: string;
        senderId: string;
      };
    },
  ): Promise<void> {
    const { roomId, data } = payload;
    if (!roomId || !data) return;
    console.log('user send message', data.message, 'to room', roomId);

    // Gửi message tới room
    server.to(roomId).emit('receive_message', data);

    // Gửi unread notification cho users không active trong room này
    await this.sendUnreadNotification(server, roomId, data);
  }

  private async sendUnreadNotification(
    server: Server,
    roomId: string,
    messageData: { message: string; senderId: string },
  ): Promise<void> {
    try {
      // Lấy tất cả users có socket connections
      const allSocketIds = Array.from(server.sockets.sockets.keys());

      for (const socketId of allSocketIds) {
        const socket = server.sockets.sockets.get(socketId);
        if (!socket || !socket['user']) continue;

        const userData = socket['user'];
        const userId = userData.sub;

        // Skip nếu là người gửi
        if (userId === messageData.senderId) continue;

        // Kiểm tra user có trong room không
        if (!socket.rooms.has(roomId)) continue;

        // Kiểm tra active room của user
        const activeRoom =
          await this.connectionService.getUserActiveRoom(userId);

        // Nếu user không active trong room này, gửi unread notification
        if (activeRoom !== roomId) {
          const unreadNotification = {
            type: 'unread_message',
            roomId,
            message: messageData.message,
            senderId: messageData.senderId,
            timestamp: new Date().toISOString(),
          };

          socket.emit('unread_message_notification', unreadNotification);
          this.logger.log(
            `Sent unread notification to user ${userId} for room ${roomId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error sending unread notifications:', error);
    }
  }

  async handleNotification(server: Server, payload: any): Promise<void> {
    const { userId, notificationData } = payload;
    if (!userId || !notificationData) return;
    const socketIds = await this.connectionService.getUserSockets(userId);
    server.to(socketIds).emit('receive_notification', notificationData);
  }
}
