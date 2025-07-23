import { Module } from '@nestjs/common';
import { WhatsAppAssistantController } from './whatsapp-assistant.controller';
import { WhatsAppAssistantService } from './whatsapp-assistant.service';


@Module({
  controllers: [WhatsAppAssistantController],
  providers: [WhatsAppAssistantService],
})
export class WhatsAppAssistantModule {}
