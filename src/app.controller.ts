import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Post()
  // sendMessage(): Promise<string | undefined> {
  //   // return this.appService.sendAImessage();
  // }

  @Post()
  chatWithOpenAIAssistant(@Body() body: any): Promise<string | any> {
    console.log('input', body);
    return this.appService.chatWithOpenAIAssistant(body.input);
  }
}
