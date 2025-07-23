import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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




  @Get('auth/callback')
  authCallbackGet(@Query('code') code: string): string {
    console.log('OAuth code received:', code);
    return `Code received: ${code}`;
  }


}
