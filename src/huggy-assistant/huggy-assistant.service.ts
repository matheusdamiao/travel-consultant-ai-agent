import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import OpenAI from "openai";
import { MessageContent } from "openai/resources/beta/threads/messages";
import { getThreadForUser, saveThreadForUser } from "src/utils/thread-storage";
import { text } from "stream/consumers";


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

@Injectable()
export class HuggyService {
   private openai: OpenAI;
    private assistantId: string | any;
    private readonly huggyToken: string;
 
  
    constructor(private readonly configService: ConfigService) {
      this.openai = new OpenAI({
        apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      });
      this.assistantId = this.configService.get<string>('ASSISTANT_ID_HUGGY');
      this.huggyToken =this.configService.get<string>('HUGGY_ACCESS_TOKEN') || '';
    }


 async chatWithHuggyAgent(input: string, customerId: string, chat: any): Promise<string | MessageContent[]> {
    try {
      // Reuse or create a thread
      let threadId = getThreadForUser(customerId);

      console.log('assistantId', this.assistantId);

      if (!threadId) {
        const thread = await this.openai.beta.threads.create();
        threadId = thread.id;
        saveThreadForUser(customerId, threadId);
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
      return await this.processThread(threadId, chat);
    } catch (error) {
      console.error('Erro ao processar a conversa:', error);
      return 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.';
    }
  }

  private async processThread(
    threadId: string,
    chat: any
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
          chat
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
    chat: any
  ) {
    for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
      const functionName: string = toolCall.function.name;
      let functionResponse = '';

      console.log('Chamando função:', functionName);

      if(functionName === 'registrar_interesse'){
      // 33239
        const chatId = chat.id;
        
          const url = `https://api.huggy.app/v3/chats/${chatId}/workflow`;
          const payload = {
            "stepId": 33239,
          }
           const res = await axios.post(url, payload, {
              headers: {
                Authorization: `Bearer ${this.huggyToken}`,
                'Content-Type': 'application/json',
              },  });
            
           let response = `Workflow atualizado para Pré-qualificação: ${res.data}`;
           functionResponse = JSON.stringify(response, null, 2);
           console.log('retorno da função:', functionResponse);
      }



        if(functionName === 'encaminhar_para_vendas'){
      // 33239
        const chatId = chat.id;
        
          const url = `https://api.huggy.app/v3/chats/${chatId}/workflow`;
          const payload = {
            "stepId": 33242,
          }
           const res = await axios.post(url, payload, {
              headers: {
                Authorization: `Bearer ${this.huggyToken}`,
                'Content-Type': 'application/json',
              },  });

            let response = `Workflow atualizado para Encaminhar para Vendas: ${res.data}`;
            functionResponse = JSON.stringify(response, null, 2);
            console.log('retorno da função:', functionResponse);
      }


        // Responder à chamada da função com os dados
      await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: [{ tool_call_id: toolCall.id, output: functionResponse }],
      });
    }
  }



 async sendMessageToCustomer(chatId: number, message: string, token: string) {
  const url = `https://api.huggy.app/v3/chats/${chatId}/messages`;
    const payload = {
     text: message,
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