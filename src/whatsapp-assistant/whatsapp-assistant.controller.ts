import { Body, Controller, Get, Post } from '@nestjs/common';
import { WhatsAppAssistantService } from './whatsapp-assistant.service';
import axios from 'axios';

@Controller('whatsapp-assistant')
export class WhatsAppAssistantController {
  constructor(private readonly whatsAppAssistantService: WhatsAppAssistantService) {}

  // @Post()
  // intentAgent(@Body() body: any): Promise<string | any> {
  //   console.log('input', body);
  //   return this.queueAgentService.chatWithQueueAgent(body.input);
  // }
@Post('webhooks')
  async receiveMessageNotification(@Body() body: any): Promise<void> {
    console.log('Received webhook event:', body);

    let changes = body.entry?.[0]?.changes?.[0];
    if (!changes) {
      console.log('No fields found in the webhook body');
      return;
    } 
    console.log('Fields:', changes);

    let msg = changes.value.messages?.[0];
    if (!msg) {
      console.log('No messages found in the webhook body');
      return;
    }
    const text: string = msg.text?.body ?? '';
    const displayPhoneNumber: string = changes.value.metadata?.phone_number_id ?? '';
    const fromPhoneNumber: string = msg.from ?? '';
      const assistantRes: any =
        await this.whatsAppAssistantService.chatWithQueueAgent(text, displayPhoneNumber, fromPhoneNumber);

      console.log('Assistant Response:', assistantRes);

      try {
         const res = await axios.post(
        `https://graph.facebook.com/v22.0/${displayPhoneNumber}/messages`,
        {
          messaging_product: 'whatsapp',
          to: fromPhoneNumber,
          text: {
            body: assistantRes[0].text.value,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          },
        },
      );
      console.log('WhatsApp API Response:', res.data);
        
      } catch (error) {
        console.error('Error sending message:', error);
        return;
        
      }


}
}