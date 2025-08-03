import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import OpenAI from "openai";
import { MessageContent } from "openai/resources/beta/threads/messages";
import { encaminharParaVendas } from "src/utils/functions";
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

      // Antes de adicionar uma nova mensagem, aguarde qualquer run ativo terminar
      let hasActiveRun = true;
      while (hasActiveRun) {
        const runsList = await this.openai.beta.threads.runs.list(threadId);
        hasActiveRun = false;
        if (runsList && runsList.data && Array.isArray(runsList.data)) {
          const activeRun = runsList.data.find((run) =>
            ["queued", "in_progress", "requires_action", "cancelling"].includes(run.status)
          );
          if (activeRun) {
            hasActiveRun = true;
            // Aguarda um pouco antes de checar novamente
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
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

    // Verifica se já existe um run ativo para a thread
    let activeRun: OpenAI.Beta.Threads.Run | null = null;
    const runsList = await this.openai.beta.threads.runs.list(threadId);
    console.log('Runs List:', runsList);
    if (runsList && runsList.data && Array.isArray(runsList.data)) {
      activeRun = runsList.data.find((run) =>
        ["queued", "in_progress", "requires_action", "cancelling"].includes(run.status)
      ) || null;
    }

    let run;
    if (activeRun) {
      run = activeRun;
    } else {
      run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
      });
    }

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

    // console.log('Mensagens:', messages.data);
    const lastMessage = messages.data.find((m) => m.role === 'assistant');

    return lastMessage?.content || 'Não entendi sua pergunta.';
  }

  private async handleFunctionCalls(
    threadId: string,
    runId: string,
    requiredAction: RequiredAction,
    chat: any
  ) {
    // Coletar todas as respostas das funções
    const toolOutputs: { tool_call_id: string; output: string }[] = [];
    for (const toolCall of requiredAction.submit_tool_outputs.tool_calls) {
      const functionName: string = toolCall.function.name;
      let functionResponse = '';

      console.log('Chamando função:', functionName);

      if(functionName === 'registrar_interesse'){
        const chatId = chat.id;
        const url = `https://api.huggy.app/v3/chats/${chatId}/workflow`;
        const payload = { "stepId": 33239 };
        const res = await axios.put(url, payload, {
          headers: {
            Authorization: `Bearer ${this.huggyToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Workflow atualizado:', res);
        let response = `Workflow atualizado para Pré-qualificação: ${res.data}`;
        functionResponse = JSON.stringify(response, null, 2);
        console.log('retorno da função:', functionResponse);
      }

      if(functionName === 'encaminhar_para_vendas'){
        const response = await encaminharParaVendas(chat, this.huggyToken);
        functionResponse = JSON.stringify(response, null, 2);
        console.log('retorno da função:', functionResponse);
      }

      if(functionName === 'enviar_mensagem_interna'){
        const args = JSON.parse(toolCall.function.arguments);
        const { name, type_of_company, chat_summary } = args;
        const chatId = chat.id;
        let message = `Nome do Lead: ${name}, Tipo de Empresa: ${type_of_company}, Resumo do Chat: ${chat_summary}`;
        functionResponse = JSON.stringify(message, null, 2);
        console.log('retorno da função:', functionResponse);
        const url = `https://api.huggy.app/v3/chats/${chatId}/messages`;
        const payload = {
          text: message,
          isInternal: true, // Marca a mensagem como interna
        };
        const res = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${this.huggyToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Message sent to customer:', res.data);
      }

      // Adiciona a resposta ao array de outputs
      toolOutputs.push({ tool_call_id: toolCall.id, output: functionResponse });
    }

    // Envia todas as respostas de uma vez
    await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
      tool_outputs: toolOutputs,
    });
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