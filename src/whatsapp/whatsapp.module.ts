import { Module } from '@nestjs/common';
import { QueueAgentModule } from 'src/queue-agent/queue-agent.module';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { QueueAgentService } from 'src/queue-agent/queue-agent.service';

@Module({
  imports: [QueueAgentModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, QueueAgentService],
})
export class WhatsAppModule {}
