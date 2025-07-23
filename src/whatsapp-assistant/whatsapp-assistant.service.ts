import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import OpenAI from 'openai';
import { MessageContent } from 'openai/resources/beta/threads/messages';
import { getThreadForUser, saveThreadForUser } from 'src/utils/thread-storage';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: any;
  };
}

interface RequiredAction {
  submit_tool_outputs: {
    tool_calls: ToolCall[];
  };
}

// // TODO: 1) msg comes from websocket connection
// //       2) assistant responds and tries to understand the intent
// //       3) depending on the intent, it calls a function to send the chat to a specific redis queue.
// //       4) the assistant answers the user to transfer the chat to a specialized human agent
// //       4) the chat now is visible in the queue and a user can respond to it
@Injectable()
export class WhatsAppAssistantService {
  private openai: OpenAI;
  private assistantId: string | any;
  private DEMO_USER_ID = 'user-123';

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.assistantId = this.configService.get<string>('ASSISTANT_ID_MINIONS');
  }

  async chatWithQueueAgent(input: string, zapId: string, clientPhoneNumber: string): Promise<string | MessageContent[]> {
    try {
      // Reuse or create a thread
      let threadId = getThreadForUser(this.DEMO_USER_ID);

      if (!threadId) {
        const thread = await this.openai.beta.threads.create();
        threadId = thread.id;
        saveThreadForUser(this.DEMO_USER_ID, threadId);
        console.log('Nova thread criada:', threadId);
      } else {
        console.log('Thread existente encontrada:', threadId);
      }

      // Add user message
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: input,
      });

      // Process and return response
      return await this.processThread(threadId, zapId, clientPhoneNumber);
    } catch (error) {
      console.error('Erro ao processar a conversa:', error);
      return 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.';
    }
  }

  private async processThread(
    threadId: string,
    zapId: string,
    clientPhoneNumber: string,
  ): Promise<string | MessageContent[]> {
    // Iniciar a execução da thread
    const run = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId,
    });

    // Monitorar até que a resposta seja finalizada
    while (true) {
      const updatedRun = await this.openai.beta.threads.runs.retrieve(
        threadId,
        run.id,
      );

      if (updatedRun.status === 'completed') {
        break;
      } else if (
        updatedRun.status === 'requires_action' &&
        updatedRun.required_action
      ) {
        // Se o assistente chamar uma função, processamos
        await this.handleFunctionCalls(
          threadId,
          run.id,
          updatedRun.required_action,
          zapId,
          clientPhoneNumber,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Aguarda um pouco antes de checar novamente
    }

    // Obter a resposta do assistente
    const messages = await this.openai.beta.threads.messages.list(threadId);

    console.log('Mensagens:', messages.data);
    const lastMessage = messages.data.find((m) => m.role === 'assistant');

    return lastMessage?.content || 'Não entendi sua pergunta.';
  }

  private async handleFunctionCalls(
    threadId: string,
    runId: string,
    requiredAction: RequiredAction,
    zapId: string,
    clientPhoneNumber: string,
  ) {
    for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
      const functionName: string = toolCall.function.name;
      let functionResponse = '';

      console.log('Chamando função:', functionName);

      console.log('zap', zapId)
      console.log('clientPhoneNumber', clientPhoneNumber);
      

      if(functionName === 'sendImage'){
      const args = JSON.parse(toolCall.function.arguments);
        const { imageUrl, courseUrl } = args;
        let res = `Image sent: ${imageUrl} (course: ${courseUrl})`;  
        console.log('arguments', args);

       

         functionResponse = JSON.stringify(res, null, 2);
        console.log('retorno da função:', functionResponse);
      try {
          // Example WhatsApp API call (customize as needed)
          await axios.post(`https://graph.facebook.com/v22.0/${zapId}/messages`, {
            messaging_product: 'whatsapp',
            to: clientPhoneNumber,
            type: 'image',
            image: {
              link: imageUrl,
              caption: `Link do curso para maiores informações: ${courseUrl}`,
            },
          }, {
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });

          // For now, just return a confirmation string
           `Image sent: ${imageUrl} (course: ${courseUrl})`;
        } catch (error) {
          console.error('Error sending image:', error);
          return 'Failed to send image.';
        }



      }

        // Responder à chamada da função com os dados
      await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: [{ tool_call_id: toolCall.id, output: functionResponse }],
      });
    }
  }
}
