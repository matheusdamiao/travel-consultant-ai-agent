import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class HuggyService {
  constructor() {}

 async sendMessageToCustomer(chatId: number, message: string, token: string) {
    const url = 'https://api.huggy.io/v3/messages';
    const payload = {
      chat: { id: chatId },
      message: {
        type: 'text',
        value: message,
      },
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Message sent to customer:', res.data);
  }
}