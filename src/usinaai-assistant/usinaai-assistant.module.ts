import { Module } from '@nestjs/common';
import { UsinaAiService } from './usinaai-assistant.service';

@Module({
  controllers: [],
  providers: [UsinaAiService],
  exports: [UsinaAiService], // Export the service if needed in other modules
})
export class UsinaAiAssistantModule {}