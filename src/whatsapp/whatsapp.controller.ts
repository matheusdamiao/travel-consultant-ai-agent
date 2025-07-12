import { Controller, Injectable, Post } from '@nestjs/common';
import { Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Body } from '@nestjs/common';
import { QueueAgentService } from '../queue-agent/queue-agent.service';

@Injectable()
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly queueAgentService: QueueAgentService) {}

  @Post('webhooks')
  async receiveMessageNotification(@Body() body: any): Promise<void> {
    if (body.field === 'messages' && body.value?.messages?.length) {
      const message = body.value.messages[0];
      const from = message.from;
      const text = message.text?.body;

      // Add this to the constructor

      // Example usage inside the method
      const assistantRes =
        await this.queueAgentService.chatWithQueueAgent(text);

      console.log('Assistant Response:', assistantRes);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log(`Received message from ${from}: ${text}`);
          resolve();
        }, 1000);
      });
      // Process the message as needed
    } else {
      console.log(
        'Received non-message notification or invalid payload:',
        body,
      );
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
