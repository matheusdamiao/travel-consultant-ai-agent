import { Body, Controller, Get, Headers, HttpCode, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { HuggyService } from './huggy-assistant/huggy-assistant.service';
import { ConfigService } from '@nestjs/config';



@Controller()
export class AppController {

 private readonly huggyToken: string;
 
  constructor(private readonly configService: ConfigService,
     private readonly appService: AppService, private readonly huggyService: HuggyService) {

      this.huggyToken =this.configService.get<string>('HUGGY_ACCESS_TOKEN') || '';
     }
  // @Post()
  // sendMessage(): Promise<string | undefined> {
  //   // return this.appService.sendAImessage();
  // }

  @Post()
  async chatWithOpenAIAssistant(@Body() body: any): Promise<string | any> {
    console.log('input', body);
    return await this.appService.chatWithOpenAIAssistant(body.input);
  }




  @Get('auth/callback')
  authCallbackGet(@Query('code') code: string): string {
    console.log('OAuth code received:', code);
    return `Code received: ${code}`;
  }

@Post('webhook')
@HttpCode(200) // Importante: retornar 200 para Huggy saber que recebeu com sucesso
async handleWebhook(@Body() body: any, @Headers() headers: any): Promise<string> {
  console.log('Webhook recebido!', body);
  console.log('Headers:', headers);

  // Extract message from webhook body
  const getMessageFromWebhook = (body: any): string | undefined => {
    // Try to get message from 'receivedMessage'
    if (body.messages.receivedMessage) {
    return body.messages.receivedMessage[0].body;
    }
    // Try to get message from 'receivedAllMessage'
    if (body.messages.receivedAllMessage) {
    return body.messages.receivedAllMessage[0].body;
    }
    return undefined;
  };

  const message = getMessageFromWebhook(body);
  console.log('Extracted message:', message);

  const assistantRes: any = await this.huggyService.chatWithHuggyAgent(message ?? '')

  // Enviar resposta para o usuário via Huggy API v3
  // Exemplo usando fetch (instale node-fetch se necessário)
  await this.huggyService.sendMessageToCustomer(
    body.messages.receivedAllMessage[0].chat.id, // ID do chat recebido no webhook
    assistantRes[0].text.value, // Mensagem de resposta do assistente
     this.huggyToken, // Token de autenticação da Huggy
  );
  
  

  // Aqui você pode processar o evento, salvar no banco, acionar lógica, etc.
  return 'Webhook recebido com sucesso!';
}

}
