import { Body, Controller, Get, Headers, HttpCode, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { get } from 'http';

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

 @Post('webhook')
  @HttpCode(200) // Importante: retornar 200 para Huggy saber que recebeu com sucesso
  handleWebhook(@Body() body: any, @Headers() headers: any): string {
    console.log('Webhook recebido!', body);
    console.log('Headers:', headers);
    // Aqui você pode processar o evento, salvar no banco, acionar lógica, etc.
    return 'Webhook recebido com sucesso!';
  }

}
