import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../modules/user/user.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // TODO: Restrict in production
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Try to get token from auth object (Socket.IO v3+) or headers
      const token = client.handshake.auth?.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Connection attempt without token from ${client.id}`);
        return client.disconnect();
      }
      
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userService.findById(payload.userId);
      if (!user) {
        this.logger.warn(`User not found for token payload: ${payload.userId}`);
        return client.disconnect();
      }

      // Join a room specific to the user for private messaging
      client.join(`user:${user.id}`);
      this.logger.log(
        `Client connected: ${client.id}, User: ${user.anonymousTag} (${user.id})`,
      );
    } catch (error) {
      this.logger.error(
        `WebSocket Connection Error for client ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emits an event to a specific user's room.
   * @param userId The ID of the user to send the message to.
   * @param event The name of the event to emit.
   * @param data The payload to send.
   */
  sendMessageToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.log(`Emitted event '${event}' to user room: user:${userId}`);
  }
}