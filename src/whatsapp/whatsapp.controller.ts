import { Controller, Injectable, Post } from '@nestjs/common';
import { Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Body } from '@nestjs/common';
import { QueueAgentService } from '../queue-agent/queue-agent.service';
import axios from 'axios';

@Injectable()
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly queueAgentService: QueueAgentService) {}

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
        await this.queueAgentService.chatWithQueueAgent(text);

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

  @Get('health')
  healthCheck(): string {
    return 'WhatsApp service is running';
  }

  @Get('webhooks')
  authWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
    @Res() res: Response,
  ) {
    const VERIFY_TOKEN = 'minionsforever';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  // @Post('webhooks')
  // @HttpCode(200)
  // handleEventNotification(
  //   @Body() body: any,
  //   @Headers('x-hub-signature-256') signature: string,
  // ): void {
  //   // Optionally, verify the signature here for security
  //   console.log('Received webhook event:', body);
  //   // Process the webhook event as needed
  // }
}
