import { Module } from '@nestjs/common';
import { QueueAgentController } from './queue-agent.controller';
import { QueueAgentService } from './queue-agent.service';
import { QueueAgentGateway } from './queue-agent.gateway';

@Module({
  controllers: [QueueAgentController],
  providers: [QueueAgentService, QueueAgentGateway],
})
export class QueueAgentModule {}
