import { Module } from '@nestjs/common';
import { HuggyService } from './huggy-assistant.service';

@Module({
  controllers: [],
  providers: [HuggyService],
  exports: [HuggyService], // Export the service if needed in other modules
})
export class WhatsAppAssistantModule {}