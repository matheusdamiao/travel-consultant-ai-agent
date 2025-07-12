import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { QueueAgentModule } from './queue-agent/queue-agent.module';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { QueueAgentController } from './queue-agent/queue-agent.controller';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { QueueAgentService } from './queue-agent/queue-agent.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna as variáveis acessíveis globalmente
    }),
    QueueAgentModule,
    WhatsAppModule,
  ],
  controllers: [AppController, WhatsappController, QueueAgentController],
  providers: [AppService, QueueAgentService],
})
export class AppModule {}
