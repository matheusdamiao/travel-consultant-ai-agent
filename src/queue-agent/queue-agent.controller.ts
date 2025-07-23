import { Body, Controller, Get, Post } from '@nestjs/common';
import { QueueAgentService } from './queue-agent.service';

@Controller('ai-assistent')
export class QueueAgentController {
  constructor(private readonly queueAgentService: QueueAgentService) {}

  // @Post()
  // intentAgent(@Body() body: any): Promise<string | any> {
  //   console.log('input', body);
  //   return this.queueAgentService.chatWithQueueAgent(body.input);
  // }



}
