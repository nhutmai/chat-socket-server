import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConnectionService } from '../connection/connection.service';
import { AuthWsMiddleware } from '../auth/ws-auth.middleware';
import { Redis } from 'ioredis';
import { redisHost, redisPort, redisChannel } from '../utils/constant';
import { WsService } from './ws.service';

@WebSocketGateway({ cors: { origin: '*', methods: ['GET', 'POST'] } })
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsGateway.name);
  private redisSubscriber: Redis;

  constructor(
    private readonly connectionService: ConnectionService,
    private readonly wsService: WsService,
  ) {
    this.redisSubscriber = new Redis({
      host: redisHost,
      port: redisPort,
    });
  }

  private getHandler(channel: string) {
    switch (channel) {
      case redisChannel.inRoomMessage:
        return this.wsService.handleNewChatMessage;
      case redisChannel.notification:
        return this.wsService.handleNotification;
      default:
        return null;
    }
  }

  onModuleInit() {
    const inRoomMessage = redisChannel.inRoomMessage;
    const notification = redisChannel.notification;

    this.redisSubscriber.subscribe(inRoomMessage, notification);

    this.redisSubscriber.on('message', async (receivedChannel, message) => {
      const handler = this.getHandler(receivedChannel);
      const payload = JSON.parse(message);
      if (!handler) {
        this.logger.warn(`❌ No handler found for channel: ${receivedChannel}`);
        return;
      }
      await handler.call(this.wsService, this.server, payload);
    });
  }

  afterInit(server: Server) {
    server.use(AuthWsMiddleware());
  }

  async handleConnection(client: Socket) {
    const data = client['user'];
    this.logger.log(data);
    if (!data.sub) {
      client.disconnect();
      return;
    }
    await this.connectionService.saveUserConnection(data.sub, client?.id);
    this.logger.log(`Client connected: ${client?.id}, UserID: ${data.sub}`);
  }

  async handleDisconnect(client: Socket) {
    await this.connectionService.removeUserConnection(client?.id);
    this.logger.log(`Client disconnected: ${client?.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Kiểm tra xem client đã ở trong room chưa
      const rooms = Array.from(client.rooms);
      if (rooms.includes(roomId)) {
        const userData = client['user'];
        this.logger.warn(`User ${userData?.sub} already in room: ${roomId}`);
        client.emit('joined_room', {
          roomId,
          success: true,
          message: 'Already in room',
        });
        return;
      }

      await client.join(roomId);
      const userData = client['user'];
      this.logger.log(`User ${userData?.sub} joined room: ${roomId}`);

      // Set active room khi join
      await this.connectionService.setUserActiveRoom(userData?.sub, roomId);

      client.emit('joined_room', { roomId, success: true });
    } catch (error) {
      this.logger.error(`Error joining room ${roomId}:`, error);
      client.emit('joined_room', {
        roomId,
        success: false,
        error: error.message,
      });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Kiểm tra xem client có trong room không
      const rooms = Array.from(client.rooms);
      if (!rooms.includes(roomId)) {
        const userData = client['user'];
        this.logger.warn(`User ${userData?.sub} not in room: ${roomId}`);
        client.emit('left_room', {
          roomId,
          success: true,
          message: 'Not in room',
        });
        return;
      }

      await client.leave(roomId);
      const userData = client['user'];
      this.logger.log(`User ${userData?.sub} left room: ${roomId}`);

      client.emit('left_room', { roomId, success: true });
    } catch (error) {
      this.logger.error(`Error leaving room ${roomId}:`, error);
      client.emit('left_room', {
        roomId,
        success: false,
        error: error.message,
      });
    }
  }

  @SubscribeMessage('set_active_room')
  async handleSetActiveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userData = client['user'];
      await this.connectionService.setUserActiveRoom(userData?.sub, roomId);
      this.logger.log(`User ${userData?.sub} set active room: ${roomId}`);

      client.emit('active_room_set', { roomId, success: true });
    } catch (error) {
      this.logger.error(`Error setting active room ${roomId}:`, error);
      client.emit('active_room_set', {
        roomId,
        success: false,
        error: error.message,
      });
    }
  }

  @SubscribeMessage('clear_active_room')
  async handleClearActiveRoom(@ConnectedSocket() client: Socket) {
    try {
      const userData = client['user'];
      await this.connectionService.removeUserActiveRoom(userData?.sub);
      this.logger.log(`User ${userData?.sub} cleared active room`);

      client.emit('active_room_cleared', { success: true });
    } catch (error) {
      this.logger.error(`Error clearing active room:`, error);
      client.emit('active_room_cleared', {
        success: false,
        error: error.message,
      });
    }
  }
}
