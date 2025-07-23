import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import OpenAI from "openai";
import { MessageContent } from "openai/resources/beta/threads/messages";
import { getThreadForUser, saveThreadForUser } from "src/utils/thread-storage";


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
    private DEMO_USER_ID = 'user-123';
  
    constructor(private readonly configService: ConfigService) {
      this.openai = new OpenAI({
        apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      });
      this.assistantId = this.configService.get<string>('ASSISTANT_ID_HUGGY');
    }


 async chatWithHuggyAgent(input: string): Promise<string | MessageContent[]> {
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
      return await this.processThread(threadId);
    } catch (error) {
      console.error('Erro ao processar a conversa:', error);
      return 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.';
    }
  }

  private async processThread(
    threadId: string
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
          updatedRun.required_action
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
    requiredAction: RequiredAction
  ) {
    for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
      const functionName: string = toolCall.function.name;
      let functionResponse = '';

      console.log('Chamando função:', functionName);

      if(functionName === 'acriar'){
      

      }

        // Responder à chamada da função com os dados
      await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: [{ tool_call_id: toolCall.id, output: functionResponse }],
      });
    }
  }



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