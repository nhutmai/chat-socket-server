import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.provider';

@Injectable()
export class ConnectionService {
  private readonly logger = new Logger(ConnectionService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async saveUserConnection(userId: string, socketId: string) {
    this.logger.log(
      `Saving connection for user: ${userId}, socket: ${socketId}`,
    );
    // Mapping userId -> Set<socketId>
    await this.redisClient.sadd(`sockets:user:${userId}`, socketId);
    // Mapping socketId -> userId
    await this.redisClient.set(`socket:${socketId}`, userId);
  }

  async removeUserConnection(socketId: string) {
    const userId = await this.redisClient.get(`socket:${socketId}`);
    if (!userId) return;

    this.logger.log(
      `Removing connection for user: ${userId}, socket: ${socketId}`,
    );
    await this.redisClient.srem(`sockets:user:${userId}`, socketId);
    await this.redisClient.del(`socket:${socketId}`);
  }

  async getUserSockets(userId: string): Promise<string[]> {
    return this.redisClient.smembers(`sockets:user:${userId}`);
  }

  // Track active room cho user
  async setUserActiveRoom(userId: string, roomId: string) {
    this.logger.log(`Setting active room for user ${userId}: ${roomId}`);
    await this.redisClient.set(`active_room:user:${userId}`, roomId);
  }

  async getUserActiveRoom(userId: string): Promise<string | null> {
    return this.redisClient.get(`active_room:user:${userId}`);
  }

  async removeUserActiveRoom(userId: string) {
    this.logger.log(`Removing active room for user ${userId}`);
    await this.redisClient.del(`active_room:user:${userId}`);
  }

  // Lấy danh sách users trong room (không bao gồm active user)
  async getUsersInRoom(
    roomId: string,
    excludeUserId?: string,
  ): Promise<string[]> {
    const pattern = `active_room:user:*`;
    const keys = await this.redisClient.keys(pattern);
    const users: string[] = [];

    for (const key of keys) {
      const activeRoom = await this.redisClient.get(key);
      if (activeRoom === roomId) {
        const userId = key.replace('active_room:user:', '');
        if (!excludeUserId || userId !== excludeUserId) {
          users.push(userId);
        }
      }
    }

    return users;
  }
}
