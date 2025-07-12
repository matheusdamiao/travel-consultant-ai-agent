import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  // Example method to send a message (implementation would depend on your WhatsApp API client)
  async sendMessage(to: string, message: string): Promise<void> {
    // Implement the logic to send a message via WhatsApp

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Message sent to ${to}: ${message}`);
        resolve();
      }, 1000);
    });
  }
}
