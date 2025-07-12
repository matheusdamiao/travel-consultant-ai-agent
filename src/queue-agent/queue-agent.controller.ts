import { Body, Controller, Post } from '@nestjs/common';
import { QueueAgentService } from './queue-agent.service';

@Controller('minion-agent')
export class QueueAgentController {
  constructor(private readonly queueAgentService: QueueAgentService) {}

  @Post()
  intentAgent(@Body() body: any): Promise<string | any> {
    console.log('input', body);
    return this.queueAgentService.chatWithQueueAgent(body.input);
  }
}
