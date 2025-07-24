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
  console.log('dados reais:', body.messages.receivedAllMessage?.[0]);

  // Extract message from webhook body
  const getMessageFromWebhook = (body: any): string | undefined => {
    if (body.messages.receivedAllMessage?.[0]) {
    return body.messages.receivedAllMessage[0].body;
    }
    return undefined;
  };

  const message = getMessageFromWebhook(body);
  console.log('Extracted message:', message);

  const assistantRes: any = await this.huggyService.chatWithHuggyAgent(message ?? '')

 const receivedMsg = body.messages.receivedAllMessage?.[0];
  if (!receivedMsg) return 'Webhook recebido com sucesso!';

  // Only respond if the sender is a WhatsApp client and receiver is agent
  if (
    receivedMsg.senderType !== 'whatsapp-enterprise' ||
    receivedMsg.receiverType !== 'agent'
  ) {
    // Message is not from client, do not respond
    return 'Webhook recebido com sucesso! msg não é de cliente';
  }

  // ...existing code to process and send message...
  await this.huggyService.sendMessageToCustomer(
    receivedMsg.chat.id,
    assistantRes[0].text.value,
    this.huggyToken,
  );
  
  

  // Aqui você pode processar o evento, salvar no banco, acionar lógica, etc.
  return 'Webhook recebido com sucesso! msg é de cliente';
}

}
