import { Socket } from 'socket.io';
import axios from 'axios';
import * as cookie from 'cookie';

export type SocketIOMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => void;

export const AuthWsMiddleware = (): SocketIOMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie || '';
      const parsed = cookie.parse(raw);
      const token =
        parsed.access_token || parsed.token || parsed.bearer || parsed.Bearer;

      const authHeader = socket.handshake.headers.authorization;
      const authToken =
        authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.split(' ')[1]
          : token;

      if (!authToken || !token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const validateUrl = `${process.env.API_SERVICE_URL}/auth/validate`;
      const response = await axios.post(
        validateUrl,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      const result = response.data;
      socket['user'] = result.data;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  };
};
