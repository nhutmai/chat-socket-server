require('dotenv').config();

const redisHost = process.env.REDIS_HOST || '';
const redisPort = parseInt(process.env.REDIS_PORT || '', 0);
const redisPassword = process.env.REDIS_PASSWORD || '';
const webPort = process.env.PORT || 3000;

const redisChannel = {
  inRoomMessage: 'in-room-message',
  notification: 'notification',
};

export { redisHost, redisPort, redisChannel, webPort, redisPassword };
