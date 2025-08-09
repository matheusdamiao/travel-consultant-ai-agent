import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppAssistantController } from './whatsapp-assistant/whatsapp-assistant.controller';
import {  WhatsAppAssistantService } from './whatsapp-assistant/whatsapp-assistant.service';
import { WhatsAppAssistantModule } from './whatsapp-assistant/whatsapp-assistant.module';
import { HuggyService } from './huggy-assistant/huggy-assistant.service';
import { UsinaAiService } from './usinaai-assistant/usinaai-assistant.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna as variáveis acessíveis globalmente
    }),
    WhatsAppAssistantModule,
  ],
  controllers: [AppController, WhatsAppAssistantController ],
  providers: [AppService, WhatsAppAssistantService, HuggyService, UsinaAiService],
})
export class AppModule {}
