import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QueueAgentService } from './queue-agent.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QueueAgentGateway {
  constructor(private readonly queueAgentService: QueueAgentService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: any): Promise<void> {
    console.log('Received message:', payload);
    // Here you can process the message and emit a response if needed

    // const res = await this.queueAgentService.chatWithQueueAgent(payload.input);

    // this.server.emit('message', { data: res });
  }
}
