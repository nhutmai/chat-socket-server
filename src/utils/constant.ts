const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 0);
const webPort = process.env.PORT || 3000;

const redisChannel = {
  inRoomMessage: 'in-room-message',
  notification: 'notification',
};

export { redisHost, redisPort, redisChannel, webPort };
